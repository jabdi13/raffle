import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

/**
 * Creates a PostgreSQL connection pool with appropriate SSL configuration.
 *
 * Automatically detects database provider and applies correct SSL settings:
 * - AWS RDS: Uses aws-rds-global-bundle.pem
 * - Aiven: Uses aiven-ca.pem
 * - Local: No SSL
 */
export function createDatabasePool(connectionString: string = process.env.DATABASE_URL || ''): Pool {
  const isRDS = connectionString.includes('rds.amazonaws.com')
  const isAiven = connectionString.includes('aivencloud.com')

  let sslConfig: any = false

  if (isRDS) {
    sslConfig = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(path.join(process.cwd(), 'certs', 'aws-rds-global-bundle.pem')).toString()
    }
  } else if (isAiven) {
    sslConfig = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(path.join(process.cwd(), 'certs', 'aiven-ca.pem')).toString()
    }
  }

  return new Pool({
    connectionString,
    ssl: sslConfig
  })
}
