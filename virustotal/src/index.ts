import { debug, getInput, info, setFailed } from '@actions/core'
import { getOctokit } from '@actions/github'
import glob from 'glob-promise'
import {
  DevelopBranches,
  getRef,
  getRepository,
  getSha,
  getShaFromRef,
  getToken,
  isDevelopBranch,
  isReleaseBranch,
  ReleaseBranches,
} from '../../lib/github'
import {
  AnalysisResult,
  guiUrlToMd5,
  md5ToGuiUrl,
  VirusTotal,
} from './virustotal'

type CommitStatus = Awaited<
  ReturnType<
    ReturnType<typeof getOctokit>['rest']['repos']['listCommitStatusesForRef']
  >
>['data'][number] & { sha: string }

const ModeAnalyse = 'analyse'
const ModeCheck = 'check'

async function analyse(vt: VirusTotal, filePath: string) {
  const result = await vt.scanFile(filePath)
  info(`File "${filePath}" has been submitted for a scan`)
  info(`Analysis URL: ${md5ToGuiUrl(result.md5)}`)
  return result
}

async function check(vt: VirusTotal, commitStatus: CommitStatus) {
  return vt.getFileReport(guiUrlToMd5(commitStatus.target_url))
}

async function writeStatus(
  octokit: ReturnType<typeof getOctokit>,
  result: AnalysisResult,
  sha?: string
) {
  await octokit.rest.repos.createCommitStatus({
    owner: 'exivity',
    repo: getRepository().component,
    sha: sha ?? getSha(),
    state:
      result.status === 'pending'
        ? 'pending'
        : result.flagged === 0
        ? 'success'
        : 'failure',
    context: `virustotal (${result.filename})`,
    description:
      result.status === 'completed'
        ? result.flagged
          ? `Detected as malicious or suspicious by ${result.flagged} security vendors`
          : 'No security vendors flagged this file as malicious'
        : undefined,
    target_url: md5ToGuiUrl(result.md5),
  })
  info('Written commit status')
}

async function getPendingVirusTotalStatuses(
  octokit: ReturnType<typeof getOctokit>
) {
  const refs = [...ReleaseBranches, ...DevelopBranches]
  const statuses: CommitStatus[] = []
  for (const ref of refs) {
    info(`Checking all statuses for ${ref}`)
    try {
      const component = getRepository().component
      const sha = await getShaFromRef({
        octokit,
        component,
        ref,
        useFallback: false,
      })
      const { data } = await octokit.rest.repos.listCommitStatusesForRef({
        owner: 'exivity',
        repo: component,
        ref: sha,
      })
      for (const status of data) {
        if (
          status.context.startsWith('virustotal') &&
          status.state === 'pending'
        ) {
          debug(`Found virustotal status "${status.context}"`)
          statuses.push({ ...status, sha })
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (
          error.message.includes('Not Found') ||
          error.message.includes('Branch not found')
        ) {
          info(`No commits found for branch ${ref}`)
        } else {
          throw error
        }
      }
    }
  }

  return statuses
}

async function run() {
  // Inputs
  const mode = getInput('mode')
  const virustotalApiKey = getInput('virustotal-api-key', {
    required: true,
  })
  const ghToken = getToken()

  // Libs
  const vt = new VirusTotal(virustotalApiKey)
  const octokit = getOctokit(ghToken)

  switch (mode) {
    case ModeAnalyse:
      // Inputs
      const path = getInput('path', { required: true })

      // Do not run on non-release and non-develop branches
      if (!isReleaseBranch() && !isDevelopBranch()) {
        info(`Skipping: feature branch "${getRef()}" is ignored`)
        return
      }

      // Obtain absolute paths
      const absPaths = await glob(path, { absolute: true })
      debug(`Absolute path to file(s): "${absPaths.join(', ')}"`)

      // Run
      for (const absPath of absPaths) {
        const result = await analyse(vt, absPath)
        await writeStatus(octokit, result)
      }

      break
    case ModeCheck:
      // Run
      for (const pendingStatus of await getPendingVirusTotalStatuses(octokit)) {
        const result = await check(vt, pendingStatus)
        await writeStatus(octokit, result, pendingStatus.sha)
      }
      break
    default:
      throw new Error(`Unknown mode "${mode}"`)
  }
}

run().catch(setFailed)