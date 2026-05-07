import { Redis } from '@upstash/redis'

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. Set them and re-run the script.')
    process.exit(1)
  }

  const redis = new Redis({ url, token })

  const rawProjects = await redis.get('projects')
  const rawStages = await redis.get('stages')
  const rawLinks = await redis.get('links')

  const projects = rawProjects ? JSON.parse(String(rawProjects)) : []
  const stages = rawStages ? JSON.parse(String(rawStages)) : []
  const links = rawLinks ? JSON.parse(String(rawLinks)) : []

  let updatedCount = 0

  for (const project of projects) {
    if (project.projectLinkUrl && String(project.projectLinkUrl).trim()) continue

    const projectStages = stages.filter((s) => s.projectId === project.id)
    if (!projectStages || projectStages.length === 0) continue

    // Find first GitHub link among the project's stages
    let found = null
    for (const stage of projectStages) {
      const stageLinks = links.filter((l) => l.stageId === stage.id && l.type === 'github' && l.url)
      if (stageLinks && stageLinks.length > 0) {
        found = stageLinks[0].url
        break
      }
    }

    if (found) {
      project.projectLinkUrl = found
      project.updatedAt = new Date().toISOString()
      updatedCount++
    }
  }

  if (updatedCount > 0) {
    await redis.set('projects', JSON.stringify(projects))
  }

  console.log(`Migration complete. Projects updated: ${updatedCount}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(2)
})
