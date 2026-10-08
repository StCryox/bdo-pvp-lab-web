import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FakeResponseOverride } from '../../test/fakeFetch'
import { renderWithProviders } from '../../test/renderWithProviders'
import { DataQualityPage } from './DataQualityPage'

const renderPage = (route = '/data-quality', overrides: FakeResponseOverride[] = []) =>
  renderWithProviders(<DataQualityPage />, { path: '/data-quality', route, overrides })

const tableRows = (name: string) =>
  within(screen.getByRole('table', { name }))
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    )

const issuesQuery = (requests: Request[]) => {
  const query: Record<string, string> = {}
  const request = requests.find((r) => r.url.includes('/issues'))
  new URL(request?.url ?? '').searchParams.forEach((value, name) => {
    query[name] = value
  })
  return query
}

const issuesTable = () => screen.findByRole('table', { name: 'Issues' })

const unavailable = (path: string): FakeResponseOverride => ({
  method: 'GET',
  path,
  status: 503,
  body: {
    type: 'about:blank',
    title: 'Warehouse unavailable',
    status: 503,
    detail: 'The DuckDB file is missing',
  },
})

describe('DataQualityPage', () => {
  it('shows one card per metric', async () => {
    renderPage()

    const metric = await screen.findByText('Damage clauses without PvP reduction', {
      selector: 'dt',
    })
    expect(metric.nextElementSibling).toHaveTextContent('133')
    expect(screen.getByText('Skills', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
      '3272',
    )
  })

  it('counts the issues of each rule by severity', async () => {
    renderPage()

    await screen.findByRole('table', { name: 'Issues per rule' })
    expect(tableRows('Issues per rule')).toEqual([
      ['Error', 'unparsed_macro', '3'],
      ['Warning', 'no_pvp_reduction', '133'],
      ['Info', 'missing_cooldown', '9'],
    ])
  })

  it('shows the first page of issues', async () => {
    renderPage()

    await issuesTable()
    expect(tableRows('Issues')).toHaveLength(20)
    expect(tableRows('Issues')[0]).toEqual([
      'Error',
      'unparsed_macro',
      'maegu',
      '3120',
      'Macro DAM_ATT_X(3) could not be parsed',
    ])
    expect(screen.getByText('Issues 1–20 of 145')).toBeInTheDocument()
  })

  it('requests a page of 20 issues', async () => {
    const { requests } = renderPage()

    await issuesTable()
    expect(issuesQuery(requests)).toEqual({
      limit: '20',
      offset: '0',
    })
  })

  it('links an issue to its skill page', async () => {
    renderPage()

    expect(await screen.findByRole('link', { name: '3120' })).toHaveAttribute(
      'href',
      '/classes/maegu/skills/3120',
    )
  })

  it('filters by severity and updates the URL', async () => {
    const { router, user } = renderPage()

    await issuesTable()
    await user.selectOptions(screen.getByLabelText('Severity'), 'error')

    expect(router.state.location.search).toBe('?severity=error')
    expect(await screen.findByText('Issues 1–3 of 3')).toBeInTheDocument()
    expect(tableRows('Issues')[2]).toEqual([
      'Error',
      'unparsed_macro',
      '—',
      '—',
      'Shared script block 77 references an unknown macro',
    ])
  })

  it('paginates with the offset in the URL', async () => {
    const { router, user } = renderPage()

    await issuesTable()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next page' }))

    expect(router.state.location.search).toBe('?offset=20')
    expect(await screen.findByText('Issues 21–40 of 145')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '1133' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(router.state.location.search).toBe('')
  })

  it('disables the next page on the last page', async () => {
    renderPage('/data-quality?severity=error')

    await screen.findByText('Issues 1–3 of 3')
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('goes back to the first page when a filter changes', async () => {
    const { router, user } = renderPage('/data-quality?offset=20')

    await issuesTable()
    await user.selectOptions(screen.getByLabelText('Severity'), 'error')

    expect(router.state.location.search).toBe('?severity=error')
  })

  it('reads the filters from the URL', async () => {
    const { requests } = renderPage('/data-quality?rule=no_pvp_reduction&class=mystic')

    await issuesTable()
    expect(issuesQuery(requests)).toEqual({
      rule: 'no_pvp_reduction',
      class_slug: 'mystic',
      limit: '20',
      offset: '0',
    })
    expect(await screen.findByRole('option', { name: 'no_pvp_reduction' })).toBeInTheDocument()
    expect(screen.getByLabelText('Rule')).toHaveValue('no_pvp_reduction')
    expect(await screen.findByRole('option', { name: 'Mystic' })).toBeInTheDocument()
    expect(screen.getByLabelText('Class')).toHaveValue('mystic')
  })

  it('filters by rule and class', async () => {
    const { router, user } = renderPage()

    await user.selectOptions(
      await screen.findByLabelText('Rule'),
      await screen.findByRole('option', { name: 'missing_cooldown' }),
    )
    await user.selectOptions(
      screen.getByLabelText('Class'),
      await screen.findByRole('option', { name: 'Shai' }),
    )

    expect(router.state.location.search).toBe('?rule=missing_cooldown&class=shai')
  })

  it('says so when no issue matches the filters', async () => {
    renderPage('/data-quality', [
      {
        method: 'GET',
        path: '/api/v1/data-quality/issues',
        status: 200,
        body: { items: [], total: 0, limit: 20, offset: 0 },
      },
    ])

    expect(await screen.findByText('No issue matches these filters.')).toBeInTheDocument()
  })

  it('shows loading states first', () => {
    renderPage()

    expect(screen.getAllByRole('status').map((s) => s.textContent)).toEqual([
      'Loading data quality report…',
      'Loading issues…',
    ])
  })

  it('shows the problem when the report fails', async () => {
    renderPage('/data-quality', [unavailable('/api/v1/data-quality')])

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Warehouse unavailable')
    expect(alert).toHaveTextContent('The DuckDB file is missing')
  })

  it('shows the problem when the issues fail', async () => {
    renderPage('/data-quality', [unavailable('/api/v1/data-quality/issues')])

    expect(await screen.findByRole('alert')).toHaveTextContent('Warehouse unavailable')
  })
})
