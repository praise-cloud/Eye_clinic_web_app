import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Package, Pill, Edit, Trash2, AlertTriangle, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../../components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { formatDate, formatCurrency } from '../../lib/utils'
import type { Drug, GlassesInventory, InventoryOthers } from '../../types'

export function InventoryPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [addItemModal, setAddItemModal] = useState(false)
  const [itemType, setItemType] = useState<'drug' | 'glasses' | 'other'>('drug')

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory', search, categoryFilter, stockFilter],
    queryFn: async () => {
      let drugs: Drug[] = []
      let glasses: GlassesInventory[] = []
      let others: InventoryOthers[] = []

      // Fetch drugs
      const { data: drugsData, error: drugsError } = await supabase
        .from('drugs')
        .select('*')
        .order('created_at', { ascending: false })

      if (drugsError) throw drugsError
      drugs = drugsData || []

      // Fetch glasses
      const { data: glassesData, error: glassesError } = await supabase
        .from('glasses_inventory')
        .select('*')
        .order('created_at', { ascending: false })

      if (glassesError) throw glassesError
      glasses = glassesData || []

      // Fetch other items
      const { data: othersData, error: othersError } = await supabase
        .from('inventory_others')
        .select('*')
        .order('created_at', { ascending: false })

      if (othersError) throw othersError
      others = othersData || []

      // Combine and filter
      const allItems = [
        ...drugs.map(item => ({ ...item, category: 'drug' })),
        ...glasses.map(item => ({ ...item, category: 'glasses' })),
        ...others.map(item => ({ ...item, category: 'other' }))
      ]

      let filtered = allItems

      // Apply search
      if (search) {
        filtered = filtered.filter(item =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description?.toLowerCase().includes(search.toLowerCase())
        )
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(item => item.category === categoryFilter)
      }

      // Apply stock filter
      if (stockFilter === 'low') {
        filtered = filtered.filter(item => item.stock_level <= item.reorder_level)
      } else if (stockFilter === 'out') {
        filtered = filtered.filter(item => item.stock_level === 0)
      }

      return filtered
    }
  })

  const addDrugMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('drugs').insert(data)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      setAddItemModal(false)
    }
  })

  const addGlassesMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('glasses_inventory').insert(data)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      setAddItemModal(false)
    }
  })

  const addOtherMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('inventory_others').insert(data)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      setAddItemModal(false)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ id, category }: { id: string, category: string }) => {
      let error
      if (category === 'drug') {
        const result = await supabase.from('drugs').delete().eq('id', id)
        error = result.error
      } else if (category === 'glasses') {
        const result = await supabase.from('glasses_inventory').delete().eq('id', id)
        error = result.error
      } else {
        const result = await supabase.from('inventory_others').delete().eq('id', id)
        error = result.error
      }
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  const canEdit = ['frontdesk', 'admin'].includes(profile?.role ?? '')
  const canDelete = ['admin'].includes(profile?.role ?? '')

  const getStockStatus = (item: any) => {
    if (item.stock_level === 0) return { color: 'destructive', text: 'Out of Stock' }
    if (item.stock_level <= item.reorder_level) return { color: 'warning', text: 'Low Stock' }
    return { color: 'success', text: 'In Stock' }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'drug': return Pill
      case 'glasses': return Package
      default: return Package
    }
  }

  const handleAddItem = (data: any) => {
    if (itemType === 'drug') {
      addDrugMutation.mutate(data)
    } else if (itemType === 'glasses') {
      addGlassesMutation.mutate(data)
    } else {
      addOtherMutation.mutate(data)
    }
  }

  const lowStockItems = inventory.filter(item => item.stock_level <= item.reorder_level).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">Manage drugs, glasses, and other medical supplies</p>
        </div>
        {canEdit && (
          <Button onClick={() => setAddItemModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Pill className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Drugs</p>
                <p className="text-2xl font-bold">{inventory.filter(item => item.category === 'drug').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Glasses</p>
                <p className="text-2xl font-bold">{inventory.filter(item => item.category === 'glasses').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="drug">Drugs</SelectItem>
                <SelectItem value="glasses">Glasses</SelectItem>
                <SelectItem value="other">Other Items</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-center">
              <Filter className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Filters Applied</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
              <p className="text-gray-600">
                {search || categoryFilter !== 'all' || stockFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first inventory item'
                }
              </p>
              {canEdit && !search && categoryFilter === 'all' && stockFilter === 'all' && (
                <Button onClick={() => setAddItemModal(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {inventory.map(item => {
                const stockStatus = getStockStatus(item)
                const CategoryIcon = getCategoryIcon(item.category)
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CategoryIcon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500 capitalize">{item.category}</span>
                          <span className="text-xs text-gray-500">SKU: {item.sku || 'N/A'}</span>
                          {item.expiry_date && (
                            <span className="text-xs text-gray-500">
                              Expires: {formatDate(item.expiry_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Stock Level</p>
                        <p className="text-lg font-bold">{item.stock_level}</p>
                        <Badge variant={stockStatus.color as any} className="text-xs">
                          {stockStatus.text}
                        </Badge>
                      </div>
                      {canEdit && (
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                              deleteMutation.mutate({ id: item.id, category: item.category })
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Modal */}
      <Modal open={addItemModal} onOpenChange={setAddItemModal}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>Add Inventory Item</ModalTitle>
            <ModalDescription>Add a new item to the inventory</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drug">Drug/Medication</SelectItem>
                    <SelectItem value="glasses">Glasses/Lenses</SelectItem>
                    <SelectItem value="other">Other Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <Input placeholder="Item name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <Input placeholder="Stock keeping unit" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input placeholder="Item description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
                  <Input type="number" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level *</label>
                  <Input type="number" placeholder="10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <Input type="number" placeholder="0.00" />
                </div>
                {itemType === 'drug' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <Input type="date" />
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setAddItemModal(false)}>Cancel</Button>
            <Button>Add Item</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
