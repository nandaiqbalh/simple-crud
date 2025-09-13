package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// sendJSONResponse is a helper function to send structured API responses
func sendJSONResponse(w http.ResponseWriter, success bool, code int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)

	response := APIResponse{
		Success: success,
		Code:    code,
		Message: message,
		Data:    data,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		// Fallback error response
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(APIResponse{
			Success: false,
			Code:    http.StatusInternalServerError,
			Message: "Failed to encode response",
			Data:    nil,
		})
	}
}

// main function to set up the server and routes
func main() {
	// Database connection with postgres as the driver and connection string from environment variable

	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Check DB connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	} else {
		log.Println("Successfully connected to the database!")
	}

	// create table if not exists
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE
	)`)

	if err != nil {
		log.Fatal(err)
	}

	// create a new router
	router := mux.NewRouter()

	router.HandleFunc("/api/go/users", getUsers(db)).Methods("GET")
	router.HandleFunc("/api/go/users", createUser(db)).Methods("POST")
	router.HandleFunc("/api/go/users/{id}", getUser(db)).Methods("GET")
	router.HandleFunc("/api/go/users/{id}", updateUser(db)).Methods("PUT")
	router.HandleFunc("/api/go/users/{id}", deleteUser(db)).Methods("DELETE")
	router.HandleFunc("/api/go/healthdb", healthDB(db)).Methods("GET")

	// wrap router with CORS and JSON content type middleware
	enhancedRouter := enableCORS(jsonContentTypeMiddleware(router))

	// start the server
	log.Fatal(http.ListenAndServe(":8000", enhancedRouter))

}

// enableCORS middleware to handle CORS
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// pass to the next handler
		next.ServeHTTP(w, r)
	})
}

// jsonContentTypeMiddleware to set Content-Type as application/json
func jsonContentTypeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
	})
}

// getUsers handler to fetch all users
func getUsers(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("Query: SELECT id, name, email FROM users")
		rows, err := db.Query("SELECT id, name, email FROM users")
		if err != nil {
			sendJSONResponse(w, false, http.StatusInternalServerError, err.Error(), nil)
			return
		}
		defer rows.Close()

		var users []User
		for rows.Next() {
			var user User
			if err := rows.Scan(&user.ID, &user.Name, &user.Email); err != nil {
				sendJSONResponse(w, false, http.StatusInternalServerError, err.Error(), nil)
				return
			}
			users = append(users, user)
		}

		sendJSONResponse(w, true, http.StatusOK, "Users fetched successfully", users)
	}
}

// get user by id
func getUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		id := params["id"]

		var user User
		log.Printf("Query: SELECT id, name, email FROM users WHERE id = %s", id)
		err := db.QueryRow("SELECT id, name, email FROM users WHERE id = $1", id).Scan(&user.ID, &user.Name, &user.Email)
		if err != nil {
			if err == sql.ErrNoRows {
				sendJSONResponse(w, false, http.StatusNotFound, "User not found", nil)
			} else {
				sendJSONResponse(w, false, http.StatusInternalServerError, err.Error(), nil)
			}
			return
		}

		sendJSONResponse(w, true, http.StatusOK, "User fetched successfully", user)
	}
}

// createUser handler to create a new user
func createUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var user User
		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			sendJSONResponse(w, false, http.StatusBadRequest, err.Error(), nil)
			return
		}

		log.Printf("Query: INSERT INTO users (name, email) VALUES (%s, %s) RETURNING id", user.Name, user.Email)
		err := db.QueryRow("INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id", user.Name, user.Email).Scan(&user.ID)
		if err != nil {
			sendJSONResponse(w, false, http.StatusInternalServerError, err.Error(), nil)
			return
		}

		sendJSONResponse(w, true, http.StatusCreated, "User created successfully", user)
	}
}

// updateUser handler to update an existing user
func updateUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		id := params["id"]

		var user User
		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			sendJSONResponse(w, false, http.StatusBadRequest, err.Error(), nil)
			return
		}

		log.Printf("Query: UPDATE users SET name = %s, email = %s WHERE id = %s", user.Name, user.Email, id)
		result, err := db.Exec("UPDATE users SET name = $1, email = $2 WHERE id = $3", user.Name, user.Email, id)
		if err != nil {
			sendJSONResponse(w, false, http.StatusInternalServerError, err.Error(), nil)
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			sendJSONResponse(w, false, http.StatusInternalServerError, err.Error(), nil)
			return
		}
		if rowsAffected == 0 {
			sendJSONResponse(w, false, http.StatusNotFound, "User not found", nil)
			return
		}

		user.ID, _ = atoi(id)
		sendJSONResponse(w, true, http.StatusOK, "User updated successfully", user)
	}
}

// deleteUser handler to delete a user
func deleteUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		id := params["id"]

		log.Printf("Query: DELETE FROM users WHERE id = %s", id)
		result, err := db.Exec("DELETE FROM users WHERE id = $1", id)
		if err != nil {
			sendJSONResponse(w, false, http.StatusInternalServerError, err.Error(), nil)
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			sendJSONResponse(w, false, http.StatusInternalServerError, err.Error(), nil)
			return
		}
		if rowsAffected == 0 {
			sendJSONResponse(w, false, http.StatusNotFound, "User not found", nil)
			return
		}

		sendJSONResponse(w, true, http.StatusOK, "User deleted successfully", nil)
	}
}

// healthDB handler to check database connection
func healthDB(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := db.Ping(); err != nil {
			sendJSONResponse(w, false, http.StatusInternalServerError, "Database connection failed: "+err.Error(), nil)
			return
		}
		sendJSONResponse(w, true, http.StatusOK, "Database connection healthy", nil)
	}
}

// atoi is a helper function to convert string to int
func atoi(s string) (int, error) {
	return strconv.Atoi(s)
}
