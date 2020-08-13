# @exivity/actions

Public GitHub Actions used at Exivity for CI/CD. These probably don't make much
sense outside the context of the Exivity development environment.

_Available actions:_

- [`accept`](#accept)
- [`db`](#db)
- [`get-artefacts`](#get-artefacts)
- [`init-ssh`](#init-ssh)
- [`put-artefacts`](#put-artefacts)
- [`rabbitmq`](#rabbitmq)

# `accept`

Triggers a scaffold repository build on AppVeyor

## Inputs

### `scaffold-branch`

**Optional** _Defaults to `develop` or `custom` depending on current branch_ The
scaffold branch to use.

### `appveyor-token`

**Required** AppVeyor API token

## Example usage

```
- uses: exivity/actions/accept@master
  with:
    scaffold-branch: some-feature-branch
    appveyor-token: ${{ secrets.APPVEYOR_TOKEN }}
```

# `db`

Runs a PostgreSQL docker container, create a new datanase, pulls in the `db`
repository migrations and runs them.

## Inputs

### `branch`

**Optional** _Default: `master`_ The db repository branch to use.

### `aws-access-key-id`

**Required** The AWS access key ID

### `aws-secret-access-key`

**Required** The AWS secret access key

## Example usage

```
- uses: exivity/actions/db@master
  with:
    branch: some-feature-branch
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

# `get-artefacts`

Download artefacts for the provided components and put them in their respective
directories. It will use the S3 _exivity_ bucket in the _eu-central-1_ region.
Artefacts are uploaded with the _build/{component}/{sha}_ prefix.

## Inputs

### `components`

**Required** A list in the form of `component@branch: path`

### `aws-access-key-id`

**Optional** _Defaults to the AWS_ACCESS_KEY_ID environment variable_ The AWS
access key ID

### `aws-secret-access-key`

**Optional** _Defaults to the AWS_SECRET_ACCESS_KEY environment variable_ The
AWS secret access key

## Example usage

```
- uses: exivity/actions/get-artefacts@master
  with:
    components:
      - testbench@master: ../testbench/build
      - bunny@master: ../bunny/build
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

# `init-ssh`

Use a private key and prime the known_hosts file with pre-loaded keys for
github.com, gitlab.com and bitbucket.org.

## Inputs

### `private-key`

**Required** The full SSH private key.

## Example usage

```
- uses: exivity/actions/init-ssh@master
  with:
    private-key: ${{ secrets.PRIVATE_KEY }}
```

Where the `PRIVATE_KEY` secret contains your private key:

```
-----BEGIN RSA PRIVATE KEY-----
key contents
-----END RSA PRIVATE KEY-----
```

# `postgres`

Starts a PostgreSQL server in a Docker container.

## Inputs

### `version`

**Optional** _Default: 12.3_ The PostgreSQL version to use. Currently, only 12.3
is supported.

## Example usage

```
- uses: exivity/actions/postgres@master
  with:
    version: 12.3
```

# `put-artefacts`

Uploads artefacts in the provided directory. It will use the S3 _exivity_ bucket
in the _eu-central-1_ region. Artefacts are downloaded from the
_build/{component}/{sha}_ prefix.

## Inputs

### `path`

**Optional** _Default: build_ Upload artefacts from this path.

### `aws-access-key-id`

**Optional** _Defaults to the AWS_ACCESS_KEY_ID environment variable_ The AWS
access key ID

### `aws-secret-access-key`

**Optional** _Defaults to the AWS_SECRET_ACCESS_KEY environment variable_ The
AWS secret access key

## Example usage

```
- uses: exivity/actions/put-artefacts@master
  with:
    path: artefacts
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

# `rabbitmq`

Starts a RabbitMQ server in a Docker container.

## Inputs

### `version`

**Optional** _Default: 3.8.6_ The RabbitMQ version to use. Currently, only 3.8.6
is supported.

## Example usage

```
- uses: exivity/actions/rabbitmq@master
  with:
    version: 3.8.6
```
