package testutil

import (
	"bytes"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kiarash86/mitra/internal/auth"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// NewGinContext builds a *gin.Context wired to a fresh httptest recorder,
// with the given method/path/body and URL params already set — enough to
// drive a handler directly, without going through the router or any
// middleware. Use SetCurrentUser to simulate an authenticated caller.
func NewGinContext(method, path string, body []byte, params gin.Params) (*gin.Context, *httptest.ResponseRecorder) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	var reqBody *bytes.Reader
	if body != nil {
		reqBody = bytes.NewReader(body)
	} else {
		reqBody = bytes.NewReader([]byte{})
	}
	req := httptest.NewRequest(method, path, reqBody)
	req.Header.Set("Content-Type", "application/json")
	c.Request = req
	c.Params = params

	return c, w
}

// SetCurrentUser simulates what middleware.RequireAuth does after
// successfully validating a bearer token: it puts the caller's user ID in
// the gin context under the same key auth.CurrentUserID reads from.
func SetCurrentUser(c *gin.Context, userID uuid.UUID) {
	c.Set(auth.ContextUserIDKey, userID)
}

// StatusCode is a small convenience for asserting on the recorder.
func StatusCode(w *httptest.ResponseRecorder) int {
	return w.Result().StatusCode
}
