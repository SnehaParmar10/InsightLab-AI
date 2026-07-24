import express from 'express';
import { 
    chatWithTutor, 
    generateQuiz, 
    submitQuizAttempt,
    getConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    getMessages,
    createMessage,
    deleteMessage,
    updateMessage,
    analyzeConversation,
    generateSimulation
} from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// AI Route bindings
router.post('/chat', authenticateToken, chatWithTutor);
router.post('/quiz', authenticateToken, generateQuiz);
router.post('/simulation/analyze', authenticateToken, analyzeConversation);
router.post('/simulation/generate', authenticateToken, generateSimulation);
router.post('/quiz/attempt', authenticateToken, submitQuizAttempt);

// Conversations CRUD
router.get('/conversations', authenticateToken, getConversations);
router.post('/conversations', authenticateToken, createConversation);
router.put('/conversations/:id', authenticateToken, updateConversation);
router.delete('/conversations/:id', authenticateToken, deleteConversation);
router.get('/conversations/:id/messages', authenticateToken, getMessages);
router.post('/conversations/:id/messages', authenticateToken, createMessage);
router.put('/conversations/:id/messages/:messageId', authenticateToken, updateMessage);
router.delete('/conversations/:id/messages/:messageId', authenticateToken, deleteMessage);

export default router;
