import toast from 'react-hot-toast';

export const ErrorToast = (msg: string) =>
  toast(msg, {
    style: {
      width: 'fit-content',
      fontSize: '14px',
      fontWeight: 'thin',
      textAlign: 'start',
      border: '1px #dc2626 solid',
      color: '#dc2626',
    },
    position: 'bottom-center',
    icon: '🚫',
  });
