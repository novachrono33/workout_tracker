import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Dumbbell, 
  Home, 
  Activity, 
  Plus, 
  BarChart3, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react'

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsMobileMenuOpen(false)
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/workouts', label: 'Workouts', icon: Activity },
    { path: '/exercises', label: 'Exercises', icon: Dumbbell },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  const NavLink = ({ item }) => {
    const Icon = item.icon
    const isActive = location.pathname === item.path
    
    return (
      <Link
        to={item.path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
        }`}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </Link>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-blue-600">
            <Dumbbell className="h-8 w-8" />
            <span className="hidden sm:block">Workout Tracker</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <Link
              to="/workouts/create"
              className="hidden sm:flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Workout</span>
            </Link>

            {/* User Menu */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                <User className="h-6 w-6" />
                <span className="hidden sm:block text-sm font-medium">
                  {user?.username}
                </span>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  <p className="font-medium">{user?.username}</p>
                  <p className="text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-600 hover:text-blue-600"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-2">
              {navItems.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
              <Link
                to="/workouts/create"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Workout</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation