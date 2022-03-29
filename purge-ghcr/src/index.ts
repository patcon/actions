import { getInput, info, setFailed } from '@actions/core'
import { getOctokit } from '@actions/github'
import { table } from '../../lib/core'
import {
  getEventData,
  getEventName,
  getRepository,
  getToken,
  isEvent,
} from '../../lib/github'
import { getTags } from '../../lib/image'

async function run() {
  // Inputs
  const component = getInput('component') || getRepository().component
  const ghToken = getToken()

  const eventName = getEventName(['delete', 'workflow_dispatch'])
  const eventData = getEventData<typeof eventName>()

  let tags: string[]

  if (isEvent(eventName, 'workflow_dispatch', eventData)) {
    tags = [eventData.inputs?.tag as string]
  } else {
    tags = getTags(eventData.ref)
  }

  table('Package name', component)
  table('Tags to delete', tags.join(','))

  const octokit = getOctokit(ghToken)

  const versions = await octokit.paginate(
    octokit.rest.packages.getAllPackageVersionsForPackageOwnedByOrg,
    {
      org: 'exivity',
      package_type: 'container',
      package_name: component,
      per_page: 100,
    }
  )

  info(`Got ${versions.length} package versions, matching with tags...`)

  // Look for versions with matching tags
  for (const version of versions) {
    const tagOverlap = tags.filter((tag) =>
      version.metadata?.container?.tags?.includes(tag)
    )

    if (tagOverlap.length > 0) {
      info(
        `🗑️ Package version ${
          version.id
        } tagged with "${version.metadata?.container?.tags?.join(
          '","'
        )}" matches and will be deleted`
      )
      await octokit.rest.packages.deletePackageVersionForOrg({
        org: 'exivity',
        package_type: 'container',
        package_name: component,
        package_version_id: version.id,
      })
    } else {
      info(
        `ℹ️ Package version ${
          version.id
        } tagged with "${version.metadata?.container?.tags?.join(
          '","'
        )}" doesn't match any of the tags to delete`
      )
    }
  }
}

run().catch(setFailed)