package web

import (
	"embed"
	"io/fs"
)

var distFS embed.FS

var FS fs.FS

func init() {
	sub, err := fs.Sub(distFS, "dist")
	if err != nil {
		panic("web: couldnt open embedded dist: " + err.Error())
	}
	FS = sub
}
