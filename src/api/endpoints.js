"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.linksApi = exports.initApi = exports.stagesApi = exports.projectsApi = void 0;
const client_1 = __importDefault(require("./client"));
// Projects API
exports.projectsApi = {
    getAll: async () => {
        const { data } = await client_1.default.get('/api/projects');
        return data.data || [];
    },
    getById: async (id) => {
        const { data } = await client_1.default.get(`/api/projects/${id}`);
        return data.data;
    },
    create: async (project) => {
        const { data } = await client_1.default.post('/api/projects', project);
        return data.data;
    },
    update: async (id, project) => {
        const { data } = await client_1.default.put(`/api/projects/${id}`, project);
        return data.data;
    },
    delete: async (id) => {
        await client_1.default.delete(`/api/projects/${id}`);
    },
};
// Stages API
exports.stagesApi = {
    getByProjectId: async (projectId) => {
        const { data } = await client_1.default.get(`/api/projects/${projectId}/stages`);
        return data.data || [];
    },
    create: async (projectId, stage) => {
        const { data } = await client_1.default.post(`/api/projects/${projectId}/stages`, stage);
        return data.data;
    },
    update: async (projectId, stageId, stage) => {
        const { data } = await client_1.default.put(`/api/projects/${projectId}/stages/${stageId}`, stage);
        return data.data;
    },
    delete: async (projectId, stageId) => {
        await client_1.default.delete(`/api/projects/${projectId}/stages/${stageId}`);
    },
    reorder: async (projectId, stageIds) => {
        const { data } = await client_1.default.post(`/api/projects/${projectId}/stages/reorder`, { stageIds });
        return data.data;
    },
};
exports.initApi = {
    initialize: async () => {
        await client_1.default.post('/api/init', {});
    },
};
// Links API
exports.linksApi = {
    getByStageId: async (projectId, stageId) => {
        const { data } = await client_1.default.get(`/api/projects/${projectId}/stages/${stageId}/links`);
        return data.data || [];
    },
    create: async (projectId, stageId, link) => {
        const { data } = await client_1.default.post(`/api/projects/${projectId}/stages/${stageId}/links`, link);
        return data.data;
    },
    update: async (projectId, stageId, linkId, link) => {
        const { data } = await client_1.default.put(`/api/projects/${projectId}/stages/${stageId}/links/${linkId}`, link);
        return data.data;
    },
    delete: async (projectId, stageId, linkId) => {
        await client_1.default.delete(`/api/projects/${projectId}/stages/${stageId}/links/${linkId}`);
    },
};
