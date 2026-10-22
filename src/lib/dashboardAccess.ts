// Mensajes del panel del coach cuando la API rechaza el acceso.
// Devuelve null si el estado HTTP no es de acceso denegado.
export function dashboardAccessMessage(status: number): { title: string; body: string } | null {
  if (status === 401) {
    return {
      title: 'Inicia sesión para ver el panel',
      body: 'Este panel contiene datos privados de clientes. Inicia sesión con tu cuenta de administrador.',
    }
  }
  if (status === 403) {
    return {
      title: 'Panel solo para administradores',
      body: 'Tu cuenta no tiene permisos para ver los datos de clientes. Si crees que es un error, escribe a soporte@menteymusculo.com.',
    }
  }
  return null
}
