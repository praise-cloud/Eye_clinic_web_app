export interface Drug {
  id: string
  name: string
  generic_name?: string
  category?: string
  unit: string
  quantity: number
  reorder_level: number
  purchase_price?: number
  selling_price: number
  supplier?: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

export interface GlassesInventory {
  id: string
  frame_name: string
  frame_brand?: string
  frame_code?: string
  color?: string
  material?: string
  gender?: 'male' | 'female' | 'unisex'
  quantity: number
  reorder_level: number
  purchase_price?: number
  selling_price: number
  created_at: string
  updated_at: string
}

export interface InventoryOthers {
  id: string
  name: string
  category?: string
  unit: string
  quantity: number
  reorder_level: number
  purchase_price?: number
  selling_price: number
  created_at: string
  updated_at: string
}
