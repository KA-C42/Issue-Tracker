import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CardBox from '@/components/cards/CardBox'

type Item = { id: string; name: string }

const items: Item[] = [
  { id: '1', name: 'First project' },
  { id: '2', name: 'Second project' },
]

function renderBox(data: Item[] | undefined, isError = false) {
  return render(
    <CardBox
      title="Owned Projects"
      data={data}
      isError={isError}
      renderCard={(item) => <div key={item.id}>{item.name}</div>}
    />,
  )
}

const errorText = /couldn.t load/i

describe('CardBox', () => {
  it('shows the frame and a loading state, not the empty message, before data arrives', () => {
    renderBox(undefined)

    expect(screen.getByText('Owned Projects')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument() // skeleton was given label "Loading"
    expect(screen.queryByText('Nothing here yet.')).not.toBeInTheDocument()
  })

  it('shows an error when loading failed and there is no data', () => {
    renderBox(undefined, true)

    expect(screen.getByText(errorText)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText('Nothing here yet.')).not.toBeInTheDocument()
  })

  it('shows the empty message when the list is empty', () => {
    renderBox([])

    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders a card for each item', () => {
    renderBox(items)

    expect(screen.getByText('First project')).toBeInTheDocument()
    expect(screen.getByText('Second project')).toBeInTheDocument()
    expect(screen.queryByText('Nothing here yet.')).not.toBeInTheDocument()
  })

  it('keeps showing cached data when a refetch fails', () => {
    renderBox(items, true)

    expect(screen.getByText('First project')).toBeInTheDocument()
    expect(screen.queryByText(errorText)).not.toBeInTheDocument()
  })
})
