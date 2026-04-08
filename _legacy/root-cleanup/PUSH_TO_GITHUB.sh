run = "npm run dev"
entrypoint = "server/index.js"

[nix]
channel = "stable-23_11"

[deployment]
run = ["sh", "-c", "npm run build && node server/index.js"]
deploymentTarget = "cloudrun"

[[ports]]
localPort = 3001
externalPort = 80

[[ports]]
localPort = 5173
externalPort = 3000
