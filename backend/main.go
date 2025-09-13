package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	Birth     time.Time `json:"birth"`
	Age       int       `json:"age"`
	Timestamp time.Time `json:"timestamp"`
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
		email TEXT NOT NULL UNIQUE,
		role TEXT NOT NULL DEFAULT 'user',
		birth DATE NOT NULL,
		age INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM AGE(birth))) STORED,
		timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

// getUsers handler to fetch all users with search and sorting
func getUsers(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get query parameters
		search := r.URL.Query().Get("search")
		sortBy := r.URL.Query().Get("sort")
		order := r.URL.Query().Get("order")

		// Build query
		query := "SELECT id, name, email, role, birth, age, timestamp FROM users"
		var args []interface{}
		var conditions []string

		// Add search conditions
		if search != "" {
			conditions = append(conditions, "(name ILIKE $1 OR email ILIKE $1 OR role ILIKE $1)")
			args = append(args, "%"+search+"%")
		}

		if len(conditions) > 0 {
			query += " WHERE " + strings.Join(conditions, " AND ")
		}

		// Add sorting
		validSorts := map[string]string{
			"name":      "name",
			"email":     "email",
			"role":      "role",
			"age":       "age",
			"timestamp": "timestamp",
		}

		if sortField, exists := validSorts[sortBy]; exists {
			orderDir := "ASC"
			if order == "desc" {
				orderDir = "DESC"
			}
			query += " ORDER BY " + sortField + " " + orderDir
		} else {
			query += " ORDER BY timestamp DESC" // default sort
		}

		log.Printf("Query: %s, Args: %v", query, args)
		rows, err := db.Query(query, args...)
		if err != nil {
			sendJSONResponse(w, false, http.StatusInternalServerError, err.Error(), nil)
			return
		}
		defer rows.Close()

		var users []User
		for rows.Next() {
			var user User
			if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.Birth, &user.Age, &user.Timestamp); err != nil {
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
		log.Printf("Query: SELECT id, name, email, role, birth, age, timestamp FROM users WHERE id = %s", id)
		err := db.QueryRow("SELECT id, name, email, role, birth, age, timestamp FROM users WHERE id = $1", id).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.Birth, &user.Age, &user.Timestamp)
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

		log.Printf("Query: INSERT INTO users (name, email, role, birth) VALUES (%s, %s, %s, %s) RETURNING id, age, timestamp", user.Name, user.Email, user.Role, user.Birth.Format("2006-01-02"))
		err := db.QueryRow("INSERT INTO users (name, email, role, birth) VALUES ($1, $2, $3, $4) RETURNING id, age, timestamp", user.Name, user.Email, user.Role, user.Birth).Scan(&user.ID, &user.Age, &user.Timestamp)
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

		log.Printf("Query: UPDATE users SET name = %s, email = %s, role = %s, birth = %s WHERE id = %s", user.Name, user.Email, user.Role, user.Birth.Format("2006-01-02"), id)
		result, err := db.Exec("UPDATE users SET name = $1, email = $2, role = $3, birth = $4 WHERE id = $5", user.Name, user.Email, user.Role, user.Birth, id)
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

		// Get updated user data
		err = db.QueryRow("SELECT id, name, email, role, birth, age, timestamp FROM users WHERE id = $1", id).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.Birth, &user.Age, &user.Timestamp)
		if err != nil {
			sendJSONResponse(w, false, http.StatusInternalServerError, err.Error(), nil)
			return
		}

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
