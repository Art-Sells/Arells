# Wallet Connection Flow Analysis: Our Implementation vs. Best Practices

## The Core Problem

**Our Current Flow:**
1. User clicks button → Optimistic UI update (`setBackendConnections`)
2. **Fire-and-forget API call** (line 229: `axios.post(...).catch(...)`)
3. Polling runs every 100ms, checks backend
4. Backend might not have saved yet (S3 write takes 100-500ms)
5. Polling sees stale data → tries to revert optimistic update
6. We skip the update (good), but timing issues cause flickering

## How OpenSea & Similar Platforms Do It

Based on industry best practices and React patterns:

### 1. **Wait for API Response**
```typescript
// ❌ Our current approach (fire-and-forget)
axios.post('/api/savePendingConnection', {...})
  .catch(err => console.error(...));

// ✅ Best practice (wait for response)
const response = await axios.post('/api/savePendingConnection', {...});
// Now we know backend received it (even if S3 hasn't propagated yet)
```

### 2. **Two-Phase Optimistic Updates**
- **Phase 1: "Sent"** - API call succeeded (backend received it)
- **Phase 2: "Confirmed"** - Backend has saved to S3 and polling confirms it

### 3. **Use WebSockets/SSE Instead of Polling**
- OpenSea uses WebSockets for real-time updates
- No polling = no race conditions
- Backend pushes updates when ready

### 4. **React's `useOptimistic` Hook (React 19)**
- Built-in optimistic update management
- Automatic rollback on failure
- Better than manual state management

## Our Specific Issues

### Issue 1: Fire-and-Forget API Calls
**Location:** `src/context/AssetConnectContext.tsx:229`
```typescript
// Update backend (non-blocking)
axios.post('/api/savePendingConnection', {
  email,
  pendingConnection: updatedConnection,
}).catch(err => console.error('[AssetConnect] Error updating backend:', err));
```

**Problem:** We don't know when backend received it, so polling might check too early.

**Fix:** Wait for API response:
```typescript
try {
  await axios.post('/api/savePendingConnection', {
    email,
    pendingConnection: updatedConnection,
  });
  // Now we know backend received it
  // Mark optimistic update as "sent" (not just "pending")
} catch (err) {
  // Rollback optimistic update on error
  console.error('[AssetConnect] Error updating backend:', err);
  // Revert optimistic state
}
```

### Issue 2: Polling Checks Before S3 Propagation
**Location:** `src/context/AssetConnectContext.tsx:750-810`

**Problem:** Even if API responds successfully, S3 write might take 100-500ms. Polling at 100ms might check before S3 is ready.

**Fix:** After API response succeeds, wait a short delay (200-300ms) before allowing polling to confirm.

### Issue 3: No Distinction Between "Sent" and "Confirmed"
**Current:** We only track "optimistic" vs "backend confirmed"

**Better:** Track three states:
- `pending` - Optimistic update, API not called yet
- `sent` - API call succeeded, backend received it (but S3 might not be ready)
- `confirmed` - Polling confirmed backend has the update

## Recommended Solution

### Step 1: Wait for API Response
```typescript
const setIsConnectingMetaMask = useCallback(async (isConnecting: boolean) => {
  if (!email) return;
  
  try {
    // ... prepare update ...
    
    // OPTIMISTIC UPDATE: Update UI immediately
    setBackendConnections((prev: any[]) => {
      // ... update logic ...
    });
    
    // Mark as optimistic (pending API call)
    optimisticUpdateRef.current = {
      walletType: 'metamask',
      field: 'walletConnecting',
      expectedValue: isConnecting,
      status: 'pending', // NEW: Track status
      timestamp: Date.now()
    };
    
    // ✅ WAIT for API response
    try {
      await axios.post('/api/savePendingConnection', {
        email,
        pendingConnection: updatedConnection,
      });
      
      // API succeeded - mark as "sent"
      if (optimisticUpdateRef.current) {
        optimisticUpdateRef.current.status = 'sent';
        optimisticUpdateRef.current.sentAt = Date.now();
      }
      
      // Wait a bit for S3 propagation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Now polling can check for confirmation
    } catch (apiError) {
      // Rollback optimistic update
      console.error('[AssetConnect] Error updating backend:', apiError);
      // Revert the optimistic state
      setBackendConnections((prev: any[]) => {
        // Revert to previous state
      });
      optimisticUpdateRef.current = null;
    }
  } catch (error) {
    console.error('[AssetConnect] Error updating walletConnecting state:', error);
  }
}, [email]);
```

### Step 2: Update Polling Logic
```typescript
// In syncStateFromBackend
if (optimistic && optimistic.status === 'sent') {
  // Backend should have it by now (we waited 200ms after API response)
  // Check if backend confirms
  if (backendValue === optimistic.expectedValue) {
    // Confirmed! Clear optimistic flag
    optimisticUpdateRef.current = null;
    return pendingConnections;
  } else {
    // Still not confirmed - but we know API succeeded
    // Wait a bit more (maybe S3 is slow)
    if (Date.now() - optimistic.sentAt < 1000) {
      // Still within reasonable time - keep optimistic state
      return currentBackendConnections;
    } else {
      // Too long - something went wrong, use backend data
      optimisticUpdateRef.current = null;
      return pendingConnections;
    }
  }
}
```

### Step 3: (Future) Use WebSockets
Instead of polling, use WebSockets:
- Backend pushes update when S3 write completes
- No polling = no race conditions
- Real-time updates

## Comparison Table

| Aspect | Our Current | Best Practice (OpenSea-style) |
|--------|-------------|-------------------------------|
| API Calls | Fire-and-forget | Await response |
| State Tracking | Optimistic vs Confirmed | Pending → Sent → Confirmed |
| Backend Sync | Polling (100ms) | WebSockets/SSE |
| Error Handling | Log only | Rollback optimistic state |
| S3 Propagation | Not accounted for | Wait 200-300ms after API response |

## Immediate Action Items

1. **Make API calls await responses** (not fire-and-forget)
2. **Add "sent" status** to optimistic updates
3. **Wait 200-300ms after API response** before allowing polling to confirm
4. **Rollback optimistic state** on API errors
5. **Consider WebSockets** for future improvements


