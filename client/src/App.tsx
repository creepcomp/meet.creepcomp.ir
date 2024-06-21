import React from "react";
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import CreateRoom from './CreateRoom';
import Room from './Room';
import { useCookies } from "react-cookie";
import { v4 as uuidv4 } from 'uuid';
import { Container } from "react-bootstrap";

const App = () => {
    const [cookies, setCookies] = useCookies();

    React.useEffect(() => {
        const nicknames = ["James", "Michael", "William", "David", "Joseph", "John", "Robert", "Thomas", "Christopher", "Daniel"];
        if (!cookies.nickname || cookies.nickname.trim() == "") {
            setCookies("nickname", nicknames[Math.floor(Math.random() * 10)])
        }
        if (!cookies.token) {
            const token = uuidv4();
            setCookies('token', token, { path: '/' });
        }
    }, [])

    return (
        <Container fluid className="p-0">
            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<CreateRoom />} />
                    <Route path='/room/:room' element={<Room />} />
                </Routes>
            </BrowserRouter>
        </Container>
    )
}

export default App;