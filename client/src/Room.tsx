import React from "react"
import { Button, Col, Row } from "react-bootstrap"
import { useParams } from "react-router-dom"
import { useCookies } from "react-cookie"
import { color } from "./Functions"
import PeerConnection from "./PeerConnection"
import Chat from "./Chat"

const Room = () => {
    const {room} = useParams()
    const [cookies, setCookie] = useCookies()
    const [connected, setConnected] = React.useState(false)
    const [users, setUsers] = React.useState([])
    const [isSpeaking, setSpeaking] = React.useState(false)
    const [isMuted, setIsMuted] = React.useState(false)
    const [isSharingCamera, setIsSharingCamera] = React.useState(false)
    const [isSharingScreen, setIsSharingScreen] = React.useState(false)
    const localVideo = React.useRef(null)
    const localStream = React.useRef(null)
    const socket = React.useRef(null)

    React.useEffect(() => {
        const init = async () => {
            await getUserMedia()
            connect()
        }
        init()
    }, [])

    const getUserMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            localVideo.current.srcObject = stream
            localStream.current = stream
            handleActiveSpeaker(localVideo.current)
        } catch (error) {
            console.error("Error accessing media devices: ", error)
        }
    }

    const connect = () => {
        const protocol = document.location.protocol === 'https:' ? 'wss' : 'ws'
        socket.current = new WebSocket(`${protocol}://${document.location.host}/ws/connect?room=${room}`)
        socket.current.addEventListener("open", onOpen)
        socket.current.addEventListener("close", onClose)
        socket.current.addEventListener("message", onMessage)
    }

    const handleActiveSpeaker = (stream) => {
        const audioContext = new window.AudioContext
        const analyser = audioContext.createAnalyser()
        const audioSource = audioContext.createMediaElementSource(stream)
        analyser.fftSize = 512;
        audioSource.connect(analyser)
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const update = () => {
            analyser.getByteFrequencyData(dataArray)
            const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setSpeaking(volume > 20)
            requestAnimationFrame(update);
        }
        update()
    }

    const onMessage = async (message) => {
        const data = JSON.parse(message.data)
        if (data.type == 'users') {
            setUsers(data.users)
        }
    }

    const onOpen = (event) => {
        setConnected(true)
    }

    const onClose = (event) => {
        setConnected(false)
    }

    const mute = () => {
        if (localStream.current) {
            localStream.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled
                setIsMuted(!track.enabled)
            })
        }
    }

    const camera = () => {
        if (localStream.current) {
            localStream.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled
                setIsSharingCamera(!track.enabled)
            })
        }
    }

    const screen = async () => {
        if (isSharingScreen) {
            getUserMedia()
            setIsSharingScreen(false)
            return
        }
        const display = await navigator.mediaDevices.getDisplayMedia({video: true})
        const audio = await navigator.mediaDevices.getUserMedia({audio: true})
        audio.getTracks().forEach(track => display.addTrack(track))
        localStream.current = display
        localVideo.current.srcObject = display
        setIsSharingScreen(true)
    }

    const disconnect = () => {
        if (socket.current) {
            socket.current.close()
            setUsers([])
            setConnected(false)
        }
    }

    return (
        <>
            {!connected && (
                <div className="w-100 h-100 position-absolute z-3 d-flex justify-content-center align-items-center" style={{ backdropFilter: "blur(5px)" }}>
                    <h3 className="bg-light text-dark p-2 rounded shadow">Connecting ..</h3>
                </div>
            )}
            <div className="d-sm-flex justify-content-center flex-wrap">
                <Col sm={6} lg={4} className={isSpeaking ? "rounded shadow position-relative m-1 border border-5" : "rounded shadow position-relative m-1"} style={{background: color(cookies.nickname)}}>
                    <h4 className="position-absolute top-50 start-50 translate-middle">{cookies.nickname} (You)</h4>
                    <video className="w-100 h-100" ref={localVideo} autoPlay playsInline muted></video>
                    <Button className="position-absolute start-0 bottom-0" variant="" onClick={() => localVideo.current.requestFullscreen()}><i className="fa-solid fa-expand"></i></Button>
                </Col>
                {users.map((x, i) => (
                    <PeerConnection key={i} user={x} localStream={localStream} socket={socket} />
                ))}
            </div>
            {socket.current ? <Chat socket={socket} /> : null}
            <div className="bg-dark rounded shadow position-absolute start-50 bottom-0 translate-middle-x m-2">
                <>
                    <Button onClick={mute} className="m-1" variant={isMuted ? "warning" : "primary"}><i className={isMuted ? "fa-solid fa-microphone" : "fa-solid fa-microphone-slash"}></i></Button>
                    <Button onClick={camera} className="m-1" variant={isSharingCamera ? "success" : "primary"} disabled={isSharingScreen}><i className="fa-solid fa-video"></i></Button>
                    <Button onClick={screen} className="m-1" variant={isSharingScreen ? "success" : "primary"}><i className="fa-solid fa-display"></i></Button>
                    <Button variant="danger" onClick={disconnect} className="m-1"><i className="fa-solid fa-phone-slash"></i></Button>
                </>
            </div>
        </>
    )
}

export default Room