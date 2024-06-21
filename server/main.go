package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type User struct {
	Token      string          `json:"token"`
	Nickname   string          `json:"nickname"`
	Connection *websocket.Conn `json:"-"`
}

type Room struct {
	Users []*User
}

var rooms map[string]*Room

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (room *Room) update() {
	if len(room.Users) > 0 {
		for _, u := range room.Users {
			users := []*User{}
			for _, _u := range room.Users {
				if u != _u {
					users = append(users, _u)
				}
			}
			u.Connection.WriteJSON(gin.H{
				"type":  "users",
				"users": users,
			})
		}
	} else {
		room.delete()
	}
}

func (room *Room) delete() {
	for k, v := range rooms {
		if v == room {
			delete(rooms, k)
			break
		}
	}
}

func (user *User) remove(room *Room) {
	var users []*User
	for _, u := range room.Users {
		if u != user {
			users = append(users, u)
		}
	}
	room.Users = users
}

func main() {
	r := gin.Default()
	rooms = make(map[string]*Room)

	r.GET("/ws/connect", func(c *gin.Context) {
		link := c.Query("room")
		room, ok := rooms[link]

		if !ok {
			room = &Room{}
			rooms[link] = room
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			fmt.Println("Error: ", err)
			return
		}

		nickname, err := c.Request.Cookie("nickname")
		if err != nil {
			fmt.Println("Error: ", err)
			return
		}

		token, err := c.Request.Cookie("token")
		if err != nil {
			fmt.Println("Error: ", err)
			return
		}

		user := &User{
			Token:      token.Value,
			Nickname:   nickname.Value,
			Connection: conn,
		}

		room.Users = append(room.Users, user)

		defer func() {
			user.remove(room)
			room.update()
			conn.Close()
		}()

		room.update()

		for {
			messageType, message, err := conn.ReadMessage()
			if err != nil {
				fmt.Println("Error: ", err)
				return
			}
			for _, u := range room.Users {
				u.Connection.WriteMessage(messageType, message)
			}
		}
	})

	r.Run("127.0.0.1:8081")
}
