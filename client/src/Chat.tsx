import React from "react";
import { Button, Form, Offcanvas } from "react-bootstrap";
import { useCookies } from "react-cookie";
import { color } from "./Functions";

const Chat = ({ socket }) => {
    const [cookies, setCookie] = useCookies();
    const [messages, setMessages] = React.useState([]);
    const [message, setMessage] = React.useState("");
    const [show, setShow] = React.useState(false)

    React.useEffect(() => {
        socket.current.addEventListener("message", onMessage)
    }, [])

    function onMessage(message) {
        const data = JSON.parse(message.data);
        if (data.type == "message") {
            setMessages(messages => [...messages, data.message])
        }
    }

    const send = () => {
        socket.current.send(
            JSON.stringify({
                type: "message",
                message: {
                    time: new Date().toTimeString().split(' ')[0],
                    user: cookies.nickname,
                    content: message
                }
            })
        )
    }

    return (
        <>
            <Button variant="secondary" className="position-fixed top-50 translate-middle-y h-25"style={{borderRadius: "0 10px 10px 0"}} onClick={() => setShow(true)}><i className="fa-solid fa-comment"></i></Button>
            <Offcanvas show={show} onHide={() => setShow(false)}>
                <Offcanvas.Header>
                    <h5>Chat</h5>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column">
                    <ul className="flex-grow-1 list-unstyled overflow-auto">
                        {messages && messages.length > 0 ? messages.map(x => (
                            <li className="rounded mb-1 p-2" style={{background: color(cookies.nickname)}}>
                                <i className="fa-solid fa-user" /> {x.user}
                                <small className="float-end">{x.time}</small>
                                <p className="m-1" dir="auto">{x.content}</p>
                            </li>
                        )) : (
                            <li className="text-center">Empty</li>
                        )}
                    </ul>
                    <div className="d-flex">
                        <Form.Control className="me-1" placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key == 'Enter' ? send() : null} />
                        <Button type="submit" onClick={send}><i className="fa-solid fa-paper-plane"></i></Button>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    )
}

export default Chat;