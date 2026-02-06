import express from 'express';
import { readiness, liveness, metrics } from '../controllers/operational.controller.js';

const router = express.Router();

// Health check endpoints - Kubernetes standard convention
router.get('/health/ready', readiness); // Standard path
router.get('/health/live', liveness); // Standard path for Docker HEALTHCHECK
router.get('/metrics', metrics);

export default router;
