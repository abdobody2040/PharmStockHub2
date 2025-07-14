module.exports = {
  apps: [
    {
      name: "pm-academy-next",
      script: "npm",
      args: "run start",
      // interpreter: "cmd.exe",   // Run command via Windows shell
      // interpreterArgs: "/c",    // Command shell argument to run one command and exit
      cwd: "./",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
