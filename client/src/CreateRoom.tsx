import React from 'react'
import { Button, Col, Form } from 'react-bootstrap'
import { useCookies } from 'react-cookie'

const CreateRoom = () => {
    const [cookies, setCookies] = useCookies()

    const create = () => {
        const timestamp = new Date().getTime()
        const code = timestamp.toString(32)
        document.location = "room/" + code
    }

    return (
        <Col sm={10} md={8} lg={6} xl={4} className='bg-dark rounded shadow text-center position-relative mx-sm-auto mx-1 p-2' style={{top: 250}}>
            <div className='p-3'>
                <h3>Simple Meeting Platform</h3>
                <p>Secure & Reliable meeting platform.</p>
            </div>
            <Form.Control placeholder='Nickname' value={cookies.nickname} onChange={e => setCookies('nickname', e.target.value)} />
            <Button className='m-2' onClick={create}>Create Room</Button>
        </Col>
    )
}

export default CreateRoom