// controllers/callController.js
export const initiateCall = (req, res) => {
  const { to, offer } = req.body;
  const from = req.user.id; // Changed to req.user.id because req.user is set by verifyToken middleware

  const targetSocket = global.onlineUsers.get(to);
  if (targetSocket) {
    global.chatSocket.to(targetSocket).emit("call-made", { from, offer });
    res.status(200).json({ message: "Call initiated" });
  } else {
    res.status(404).json({ message: "User not online" });
  }
};
