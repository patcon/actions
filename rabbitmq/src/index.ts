import { dockerAction } from '../../lib'

const image = 'exivity/rabbitmq'
const defaultVersion = '3.8.6'

dockerAction({
  image,
  defaultVersion,
})
