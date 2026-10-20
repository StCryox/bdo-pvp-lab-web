import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { LoginGate } from './LoginGate'

function renderGate() {
  const user = userEvent.setup()
  render(
    <LoginGate storage={window.sessionStorage}>
      <p>Protected app</p>
    </LoginGate>,
  )
  return { user }
}

async function logIn(user: ReturnType<typeof userEvent.setup>, login: string, password: string) {
  await user.type(screen.getByLabelText('Login'), login)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Log in' }))
}

describe('LoginGate', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('shows the login form instead of the app', () => {
    renderGate()

    expect(screen.getByRole('heading', { name: 'BDO PvP Lab' })).toBeInTheDocument()
    expect(screen.queryByText('Protected app')).not.toBeInTheDocument()
  })

  it('shows the app after a valid login', async () => {
    const { user } = renderGate()

    await logIn(user, 'iamgroot', 'iamnotgrood')

    expect(screen.getByText('Protected app')).toBeInTheDocument()
  })

  it('shows an error and keeps the app hidden after a wrong password', async () => {
    const { user } = renderGate()

    await logIn(user, 'iamgroot', 'wrong')

    expect(screen.getByRole('alert')).toHaveTextContent('Wrong login or password')
    expect(screen.queryByText('Protected app')).not.toBeInTheDocument()
  })

  it('remembers the login in the storage it receives', async () => {
    const { user } = renderGate()
    await logIn(user, 'iamgroot', 'iamnotgrood')

    renderGate()

    expect(screen.getAllByText('Protected app')).toHaveLength(2)
  })
})
