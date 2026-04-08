"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const listings_1 = __importDefault(require("./routes/listings"));
const broadcasts_1 = __importDefault(require("./routes/broadcasts"));
const chats_1 = __importDefault(require("./routes/chats"));
const ai_1 = __importDefault(require("./routes/ai"));
const offers_1 = __importDefault(require("./routes/offers"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/listings', listings_1.default);
app.use('/api/broadcasts', broadcasts_1.default);
app.use('/api/chats', chats_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/offers', offers_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/transactions', transactions_1.default);
// Static files for frontend
const clientDistPath = path_1.default.join(__dirname, '../../client/dist');
app.use(express_1.default.static(clientDistPath));
// Catch-all to serve index.html for SPA routing
app.all('*', (req, res) => {
    res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
});
// MongoDB Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sellit';
mongoose_1.default.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
