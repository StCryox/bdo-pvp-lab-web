import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import contractSource from '../../contracts/openapi.yaml?raw'
import type { WireMockMapping } from './fakeFetch'

interface Operation {
  operationId: string
  responses: Record<string, { $ref?: string; content?: Record<string, { schema: object }> }>
}

const contract = parse(contractSource) as {
  paths: Record<string, Record<string, Operation>>
  components: { responses: Record<string, { content: Record<string, { schema: object }> }> }
}

const fixtures = import.meta.glob<unknown>('./fixtures/*.json', { eager: true, import: 'default' })
const mappings = import.meta.glob<WireMockMapping>('../../wiremock/mappings/*.json', {
  eager: true,
  import: 'default',
})

const fixtureName = (path: string): string => path.split('/').pop() ?? path

const ajv = new Ajv2020({ strict: false, validateFormats: false })
ajv.addSchema({ $id: 'contract', components: contract.components })

const operations = Object.entries(contract.paths).flatMap(([, methods]) =>
  Object.entries(methods).map(([method, operation]) => ({ method, operation })),
)

const responseSchema = (operationId: string, method: string, status: number): object => {
  const found = operations.find(
    (o) => o.operation.operationId === operationId && o.method === method.toLowerCase(),
  )
  if (!found) throw new Error(`No ${method} operation ${operationId} in the contract`)
  const response = found.operation.responses[String(status)]
  if (!response) throw new Error(`${operationId} declares no ${status} response`)
  const resolved = response.$ref
    ? contract.components.responses[response.$ref.split('/').pop() ?? '']
    : response
  const content = Object.values(resolved?.content ?? {})[0]
  if (!content) throw new Error(`${operationId} ${status} has no body`)
  return JSON.parse(JSON.stringify(content.schema).replaceAll('"#/', '"contract#/')) as object
}

describe('WireMock mappings and fixtures', () => {
  const mappingEntries = Object.entries(mappings)

  it('has a mapping for every contract operation', () => {
    const mapped = new Set(mappingEntries.map(([, m]) => m.metadata.operationId))

    expect([...mapped].sort()).toEqual(operations.map((o) => o.operation.operationId).sort())
  })

  it('uses every fixture in at least one mapping', () => {
    const used = new Set(mappingEntries.map(([, m]) => m.response.bodyFileName))

    expect(
      Object.keys(fixtures)
        .map(fixtureName)
        .filter((name) => !used.has(name)),
    ).toEqual([])
  })

  it.each(mappingEntries)('%s serves a body that validates against the contract', (_, mapping) => {
    const { bodyFileName, status } = mapping.response
    const body = fixtures[`./fixtures/${bodyFileName}`]
    expect(body, `missing fixture ${bodyFileName}`).toBeDefined()

    const validate = ajv.compile(
      responseSchema(mapping.metadata.operationId, mapping.request.method, status),
    )

    expect(validate(body), JSON.stringify(validate.errors)).toBe(true)
  })
})
