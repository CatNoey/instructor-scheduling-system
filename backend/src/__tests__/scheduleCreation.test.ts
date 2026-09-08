// src/__tests__/scheduleCreation.test.ts
import request from 'supertest';
import app from '../server';
import { Schedule } from '../models/Schedule';

describe('Schedule Creation', () => {
  beforeEach(async () => {
    await Schedule.destroy({ where: {} }); // Clear the schedule table before each test
  });

  it('should create a new schedule', async () => {
    const scheduleData = {
      date: new Date(),
      institutionName: 'Test School',
      region: 'Test Region',
      capacity: 30,
      trainingType: 'class',
    };

    const response = await request(app)
      .post('/api/schedules/create')
      .send(scheduleData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.institutionName).toBe(scheduleData.institutionName);
    expect(response.body.region).toBe(scheduleData.region);
    expect(response.body.capacity).toBe(scheduleData.capacity);
    expect(response.body.trainingType).toBe(scheduleData.trainingType);
    expect(response.body.status).toBe('open');

    // Verify the schedule was actually saved to the database
    const savedSchedule = await Schedule.findByPk(response.body.id);
    expect(savedSchedule).not.toBeNull();
    expect(savedSchedule?.institutionName).toBe(scheduleData.institutionName);
  });

  it('should return 500 if required fields are missing', async () => {
    const incompleteScheduleData = {
      date: new Date(),
      institutionName: 'Test School',
      // Missing other required fields
    };

    const response = await request(app)
      .post('/api/schedules/create')
      .send(incompleteScheduleData);

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('message', 'Error creating schedule');
  });
});