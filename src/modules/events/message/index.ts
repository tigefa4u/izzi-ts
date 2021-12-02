const handleMessageEvents = (client) => {
    client.on("message", (message) => {
        if (message.author.bot || message.channel.type === "dm") return;
    });
};

export default handleMessageEvents;
