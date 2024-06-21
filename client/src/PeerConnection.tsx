import React from "react"
import { Button, Col } from "react-bootstrap"
import { color } from "./Functions"
import { useCookies } from "react-cookie"

const PeerConnection = ({ user, localStream, socket }) => {
    const [cookies, setCookie] = useCookies()
    const [isSpeaking, setIsSpeaking] = React.useState(false)
    const peerConnection = React.useRef(null)
    const remoteVideo = React.useRef(null)
    let offerReceived = React.useRef(false)

    React.useEffect(() => {
        peerConnection.current = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
                { urls: "stun:stun3.l.google.com:19302" },
                { urls: "stun:stun4.l.google.com:19302" },
            ]
        })
        peerConnection.current.addEventListener("track", onTrack)
        peerConnection.current.addEventListener("icecandidate", onIceCandidate)

        localStream.current.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, localStream.current)
        })

        socket.current.addEventListener("message", onMessage)

        setTimeout(() => {
            if (!offerReceived.current) {
                offerReceived.current = true
                sendOffer()
            }
        }, Math.random() * 5000)

        return () => {
            socket.current.removeEventListener("message", onMessage)
            peerConnection.current.close()
        }
    }, [])

    const sendOffer = async () => {
        try {
            const offer = await peerConnection.current.createOffer()
            await peerConnection.current.setLocalDescription(offer)
            socket.current.send(JSON.stringify({
                type: 'offer',
                user: user.token,
                sdp: peerConnection.current.localDescription,
            }))
        } catch (error) {
            console.error("Error creating offer:", error)
        }
    }

    const onMessage = async (message) => {
        const data = JSON.parse(message.data)
        if (data.user != cookies.token) return
        try {
            if (data.type === 'offer') {
                if (!offerReceived.current) offerReceived.current = true
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp))
                const answer = await peerConnection.current.createAnswer()
                await peerConnection.current.setLocalDescription(answer)
                socket.current.send(JSON.stringify({
                    type: 'answer',
                    user: user.token,
                    sdp: peerConnection.current.localDescription
                }))
            } else if (data.type === 'answer') {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp))
            } else if (data.type === 'candidate') {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate))
            }
        } catch (error) {
            console.error(`Error handling ${data.type}:`, error)
        }
    }

    const onIceCandidate = (event) => {
        if (event.candidate) {
            socket.current.send(
                JSON.stringify({
                    type: 'candidate',
                    user: user.token,
                    candidate: event.candidate
                })
            )
        }
    }

    const onTrack = (event) => {
        remoteVideo.current.srcObject = event.streams[0]
        handleActiveSpeaker(remoteVideo.current)
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
            setIsSpeaking(volume > 20)
            requestAnimationFrame(update);
        }
        update()
    }

    return (
        <Col sm={6} lg={4}  className={isSpeaking ? "rounded shadow position-relative m-1 border border-5" : "rounded shadow position-relative m-1"} style={{ background: color(user.nickname) }}>
            <h3 className="position-absolute top-50 start-50 translate-middle">{user.nickname}</h3>
            <video className="w-100 h-100" ref={remoteVideo} autoPlay playsInline></video>
            <Button className="position-absolute start-0 bottom-0" variant="" onClick={() => remoteVideo.current.requestFullscreen()}><i className="fa-solid fa-expand"></i></Button>
        </Col>
    )
}

export default PeerConnection
