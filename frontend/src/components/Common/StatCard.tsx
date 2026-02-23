import React from 'react';
import { Card, CardContent, Box, Typography, Avatar, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: number;
  loading?: boolean;
}

const formatNumber = (v: string | number): string => {
  if (typeof v === 'number') {
    if (v >= 1_000_000) return `$ ${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return v.toLocaleString('es-AR');
    return v.toString();
  }
  return v;
};

export default function StatCard({ title, value, subtitle, icon, color = '#1565c0', trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card sx={{ borderRadius: 3, p: 1 }}>
        <CardContent>
          <Skeleton variant="rectangular" height={80} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' },
        transition: 'all 0.2s',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase" letterSpacing={0.5}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 0.5 }}>
              {formatNumber(value)}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                {trend >= 0 ? (
                  <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography variant="caption" color={trend >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}18`,
              color: color,
              width: 52,
              height: 52,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}
