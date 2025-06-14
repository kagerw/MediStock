import { render, screen } from '../../test-utils'
import StockAlert from '../../../ui/StockAlert'

describe('StockAlert', () => {
  const mockLowStockMedicines = [
    { id: 1, name: '在庫少薬A', quantity: 2 },
    { id: 2, name: '在庫少薬B', quantity: 1 }
  ]

  const mockOutOfStockMedicines = [
    { id: 3, name: '在庫切れ薬A', quantity: 0 },
    { id: 4, name: '在庫切れ薬B', quantity: 0 }
  ]

  describe('レンダリング', () => {
    it('在庫アラートがない場合は何も表示されない', () => {
      const { container } = render(
        <StockAlert 
          lowStockMedicines={[]} 
          outOfStockMedicines={[]} 
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('在庫切れ薬がある場合にアラートが表示される', () => {
      render(
        <StockAlert 
          lowStockMedicines={[]} 
          outOfStockMedicines={mockOutOfStockMedicines} 
        />
      )

      expect(screen.getByText('在庫アラート')).toBeInTheDocument()
      expect(screen.getByText('在庫切れ: 在庫切れ薬A, 在庫切れ薬B')).toBeInTheDocument()
    })

    it('在庫少薬がある場合にアラートが表示される', () => {
      render(
        <StockAlert 
          lowStockMedicines={mockLowStockMedicines} 
          outOfStockMedicines={[]} 
        />
      )

      expect(screen.getByText('在庫アラート')).toBeInTheDocument()
      expect(screen.getByText('在庫僅少（3個以下）: 在庫少薬A(2個), 在庫少薬B(1個)')).toBeInTheDocument()
    })

    it('在庫切れと在庫少の両方がある場合に両方表示される', () => {
      render(
        <StockAlert 
          lowStockMedicines={mockLowStockMedicines} 
          outOfStockMedicines={mockOutOfStockMedicines} 
        />
      )

      expect(screen.getByText('在庫アラート')).toBeInTheDocument()
      expect(screen.getByText('在庫切れ: 在庫切れ薬A, 在庫切れ薬B')).toBeInTheDocument()
      expect(screen.getByText('在庫僅少（3個以下）: 在庫少薬A(2個), 在庫少薬B(1個)')).toBeInTheDocument()
    })

    it('アラートアイコンが表示される', () => {
      render(
        <StockAlert 
          lowStockMedicines={mockLowStockMedicines} 
          outOfStockMedicines={[]} 
        />
      )

      // AlertTriangleアイコンが表示されることを確認
      const alertIcon = screen.getByText('在庫アラート').previousSibling
      expect(alertIcon).toBeInTheDocument()
    })
  })

  describe('単一の薬の場合', () => {
    it('在庫切れ薬が1つの場合', () => {
      const singleOutOfStock = [{ id: 1, name: '単一在庫切れ薬', quantity: 0 }]
      
      render(
        <StockAlert 
          lowStockMedicines={[]} 
          outOfStockMedicines={singleOutOfStock} 
        />
      )

      expect(screen.getByText('在庫切れ: 単一在庫切れ薬')).toBeInTheDocument()
    })

    it('在庫少薬が1つの場合', () => {
      const singleLowStock = [{ id: 1, name: '単一在庫少薬', quantity: 3 }]
      
      render(
        <StockAlert 
          lowStockMedicines={singleLowStock} 
          outOfStockMedicines={[]} 
        />
      )

      expect(screen.getByText('在庫僅少（3個以下）: 単一在庫少薬(3個)')).toBeInTheDocument()
    })
  })

  describe('スタイリング', () => {
    it('適切なCSSクラスが適用されている', () => {
      render(
        <StockAlert 
          lowStockMedicines={mockLowStockMedicines} 
          outOfStockMedicines={[]} 
        />
      )

      const alertContainer = screen.getByText('在庫アラート').closest('div').parentElement
      expect(alertContainer).toHaveClass('bg-yellow-50', 'border-l-4', 'border-yellow-400')
    })
  })

  describe('プロパティのバリデーション', () => {
    it('undefinedのプロパティでもエラーにならない', () => {
      expect(() => {
        render(<StockAlert />)
      }).not.toThrow()
    })

    it('空の配列が渡された場合は何も表示されない', () => {
      const { container } = render(
        <StockAlert 
          lowStockMedicines={[]} 
          outOfStockMedicines={[]} 
        />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('薬名の表示', () => {
    it('複数の薬名がカンマ区切りで表示される', () => {
      const multipleMedicines = [
        { id: 1, name: '薬A', quantity: 0 },
        { id: 2, name: '薬B', quantity: 0 },
        { id: 3, name: '薬C', quantity: 0 }
      ]

      render(
        <StockAlert 
          lowStockMedicines={[]} 
          outOfStockMedicines={multipleMedicines} 
        />
      )

      expect(screen.getByText('在庫切れ: 薬A, 薬B, 薬C')).toBeInTheDocument()
    })

    it('在庫少薬の数量が正しく表示される', () => {
      const medicinesWithQuantity = [
        { id: 1, name: '薬A', quantity: 1 },
        { id: 2, name: '薬B', quantity: 3 }
      ]

      render(
        <StockAlert 
          lowStockMedicines={medicinesWithQuantity} 
          outOfStockMedicines={[]} 
        />
      )

      expect(screen.getByText('在庫僅少（3個以下）: 薬A(1個), 薬B(3個)')).toBeInTheDocument()
    })
  })
})
