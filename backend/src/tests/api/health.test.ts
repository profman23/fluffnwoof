// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Health API Tests
// Tests for health check endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Health API', () => {
  describe('GET /health', () => {
    it('should return 200 with success message', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should include correct timestamp format', async () => {
      const response = await request(app).get('/health').expect(200);

      // Verify timestamp is valid ISO string
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect('Content-Type', /json/);

      // Should return 200 or 503 based on health
      expect([200, 503]).toContain(response.status);

      expect(response.body).toMatchObject({
        status: expect.stringMatching(/healthy|degraded|unhealthy/),
        timestamp: expect.any(String),
        version: expect.any(String),
        environment: expect.any(String),
        uptime: expect.any(Number),
        checks: expect.objectContaining({
          database: expect.objectContaining({
            status: expect.stringMatching(/healthy|degraded|unhealthy/),
          }),
          memory: expect.objectContaining({
            status: expect.stringMatching(/healthy|degraded|unhealthy/),
          }),
          cpu: expect.objectContaining({
            status: expect.stringMatching(/healthy|degraded|unhealthy/),
          }),
        }),
      });
    });

    it('should include memory details', async () => {
      const response = await request(app).get('/health/detailed');

      expect(response.body.checks.memory.details).toMatchObject({
        heapUsed: expect.stringMatching(/\d+MB/),
        heapTotal: expect.stringMatching(/\d+MB/),
        heapUsedPercent: expect.stringMatching(/\d+\.\d+%/),
      });
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app).get('/health/ready');

      // Should return 200 or 503 based on database connection
      expect([200, 503]).toContain(response.status);

      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        alive: true,
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      });
    });

    it('should have positive uptime', async () => {
      const response = await request(app).get('/health/live').expect(200);

      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /health/metrics', () => {
    it('should return Prometheus format metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect('Content-Type', /text\/plain/)
        .expect(200);

      // Verify Prometheus format
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
      expect(response.text).toContain('nodejs_heap_size_total_bytes');
      expect(response.text).toContain('nodejs_heap_size_used_bytes');
      expect(response.text).toContain('process_uptime_seconds');
    });
  });
});
