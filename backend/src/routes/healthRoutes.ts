// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Enhanced Health Check Routes
// Provides detailed health status for monitoring and load balancers
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import os from 'os';

const router = Router();

// Types
interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  details?: Record<string, unknown>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    memory: ComponentHealth;
    cpu: ComponentHealth;
  };
}

// ════════════════════════════════════════════════════════════════
// Simple Health Check - For Load Balancers
// ════════════════════════════════════════════════════════════════
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'FluffNwoof API is running',
    timestamp: new Date().toISOString(),
  });
});

// ════════════════════════════════════════════════════════════════
// Detailed Health Check - For Monitoring Systems
// ════════════════════════════════════════════════════════════════
router.get('/detailed', async (_req: Request, res: Response) => {
  const checks: HealthStatus['checks'] = {
    database: { status: 'unhealthy' },
    memory: { status: 'unhealthy' },
    cpu: { status: 'unhealthy' },
  };

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - dbStart;
    checks.database = {
      status: latency < 100 ? 'healthy' : latency < 500 ? 'degraded' : 'unhealthy',
      latency,
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  checks.memory = {
    status: heapUsedPercent < 70 ? 'healthy' : heapUsedPercent < 90 ? 'degraded' : 'unhealthy',
    details: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsedPercent: `${heapUsedPercent.toFixed(1)}%`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    },
  };

  // CPU check
  const cpuUsage = os.loadavg()[0];
  const cpuCount = os.cpus().length;
  const cpuPercent = (cpuUsage / cpuCount) * 100;
  checks.cpu = {
    status: cpuPercent < 70 ? 'healthy' : cpuPercent < 90 ? 'degraded' : 'unhealthy',
    details: {
      loadAverage: cpuUsage.toFixed(2),
      cores: cpuCount,
      usagePercent: `${cpuPercent.toFixed(1)}%`,
    },
  };

  // Determine overall status
  const statuses = Object.values(checks).map((c) => c.status);
  let overallStatus: HealthStatus['status'] = 'healthy';
  if (statuses.includes('unhealthy')) overallStatus = 'unhealthy';
  else if (statuses.includes('degraded')) overallStatus = 'degraded';

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks,
  };

  res.status(overallStatus === 'unhealthy' ? 503 : 200).json(response);
});

// ════════════════════════════════════════════════════════════════
// Kubernetes Readiness Probe
// ════════════════════════════════════════════════════════════════
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ready: true, timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ ready: false, timestamp: new Date().toISOString() });
  }
});

// ════════════════════════════════════════════════════════════════
// Kubernetes Liveness Probe
// ════════════════════════════════════════════════════════════════
router.get('/live', (_req: Request, res: Response) => {
  res.json({
    alive: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ════════════════════════════════════════════════════════════════
// Prometheus Metrics Endpoint
// ════════════════════════════════════════════════════════════════
router.get('/metrics', async (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();

  const metrics = `
# HELP nodejs_heap_size_total_bytes Total heap size in bytes
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes ${memUsage.heapTotal}

# HELP nodejs_heap_size_used_bytes Used heap size in bytes
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes ${memUsage.heapUsed}

# HELP nodejs_external_memory_bytes External memory in bytes
# TYPE nodejs_external_memory_bytes gauge
nodejs_external_memory_bytes ${memUsage.external}

# HELP nodejs_rss_bytes Resident Set Size in bytes
# TYPE nodejs_rss_bytes gauge
nodejs_rss_bytes ${memUsage.rss}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP nodejs_version_info Node.js version information
# TYPE nodejs_version_info gauge
nodejs_version_info{version="${process.version}"} 1
`.trim();

  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(metrics);
});

export default router;
