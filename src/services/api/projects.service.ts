import api from './axiosConfig';
import { 
  ICreateProjectRequest,
  IUpdateProjectRequest
} from '../../types/types';

export const projectsService = {
  // Get all projects for the logged-in professor
  getAll: () => api.get('/projects'),
  
  // Get a specific project by ID
  getById: (id: string) => api.get(`/projects/${id}`),
  
  // Create a new project
  create: (data: ICreateProjectRequest) => 
    api.post('/projects', data),
  
  // Update an existing project
  update: (id: string, data: IUpdateProjectRequest) => 
    api.put(`/projects/${id}`, data),
  
  // Delete a project
  delete: (id: string) => api.delete(`/projects/${id}`)
};