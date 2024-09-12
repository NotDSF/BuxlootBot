module.exports = {
  apps : [{
    name   : "BuxBot",
    script : "node",
    error_file: "errors.txt",
    out_file: "out.txt",
    args: ".",
    env: {
      NODE_ENV: "production"
    }
  }]
}
