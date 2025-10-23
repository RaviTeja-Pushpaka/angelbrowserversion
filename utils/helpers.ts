export const canvasToJpegDataUrl = (
  canvas: HTMLCanvasElement,
  quality = 0.8
): Promise<string> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas toBlob returned null'));
        const fr = new FileReader();
        fr.onloadend = () => resolve(fr.result as string);
        fr.onerror = reject;
        fr.readAsDataURL(blob); // → data:image/jpeg;base64,
      },
      'image/jpeg',
      quality
    );
  });

/**
 * Check if user has unlimited access based on plan
 */
export const hasUnlimitedAccess = (planId: string): boolean => {
  return planId === 'magic' || planId === 'ultimate' || 
         planId.startsWith('magic-') || planId.startsWith('ultimate-');
};

/**
 * Get user's credit limit based on plan
 */
export const getUserCreditLimit = (planId: string): number => {
  // Magic and Ultimate plans (any duration) get unlimited access
  if (planId === 'magic' || planId === 'ultimate' || 
      planId.startsWith('magic-') || planId.startsWith('ultimate-')) {
    return -1; // -1 means unlimited
  }
  
  // All other plans get exactly 10 credits
  return 10;
};

/**
 * Check if user can access a specific service
 */
export const canAccessService = (planId: string, serviceName: string): boolean => {
  // Free and Pro plans have limited access
  if (planId === 'free' || planId === 'pro') {
    return ['text', 'basic-voice'].includes(serviceName);
  }
  
  // Magic and Ultimate plans have unlimited access to all services
  if (planId === 'magic' || planId === 'ultimate') {
    return true;
  }
  
  return false;
};
