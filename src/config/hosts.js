"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ALLOWED_ORIGINS = exports.API_BASE_URL = void 0;
// Centralized API base configuration for frontend
exports.API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
exports.DEFAULT_ALLOWED_ORIGINS = import.meta.env.VITE_ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173';
