const ws = new WebSocket("ws://localhost:8082/");
ws.addEventListener('message', (msg)=>{
    const obj = JSON.parse(msg.data)

    switch (obj.type) {
        case 'qr':
            document.getElementById("status").innerText = "Waiting for user to scan the qr code...";
            document.getElementById("qrCode").src = obj.url;
            break;
        case 'token':
            document.getElementById("status").innerText = `Got token: ${JSON.parse(obj.token)}`;
            document.getElementById("qrCode").remove();
    }
})
