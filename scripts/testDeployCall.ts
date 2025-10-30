// scripts/testDeployCall.ts
async function simulateDeploy() {
  const res = await fetch("http://localhost:3000/api/deploy/690293159ab23a81bb6a4b44", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      logs: "Starting deployment simulation...\n✅ Build complete.\n✅ Files uploaded.",
    }),
  });

  const data = await res.json();
  console.log("Response:", data);
}

simulateDeploy();
