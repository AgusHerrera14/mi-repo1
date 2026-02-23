import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import { Business, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Ingrese usuario y contraseña');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error de autenticación. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 50%, #01579b 100%)',
      }}
    >
      <Card
        sx={{
          width: 420,
          borderRadius: 4,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 8px 24px rgba(21,101,192,0.4)',
              }}
            >
              <Business sx={{ color: 'white', fontSize: 36 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Blue Corp
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Sistema de Gestión Previsional
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                boxShadow: '0 4px 16px rgba(21,101,192,0.4)',
                '&:hover': { boxShadow: '0 6px 20px rgba(21,101,192,0.5)' },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar al Sistema'}
            </Button>
          </form>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f7fa', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" fontWeight={600} mb={0.5}>
              Credenciales de prueba:
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Admin: admin / admin123
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Operador: operador1 / op123456
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
