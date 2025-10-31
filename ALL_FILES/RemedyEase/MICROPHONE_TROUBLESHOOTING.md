# 🎤 Microphone Feature Troubleshooting Guide

## Why Microphone Works Locally But Not in Deployment

### 1. **HTTPS Requirement** ⚠️
- **Problem**: Web browsers require HTTPS for microphone access (security policy)
- **Local**: Works on `localhost` (exception to HTTPS rule)
- **Deployment**: MUST use HTTPS
- **Solution**: 
  - ✅ Vercel automatically provides HTTPS
  - ✅ Ensure your custom domain has SSL certificate
  - ✅ Check that `https://` is in the URL (not `http://`)

### 2. **Browser Permissions** 🔒
- **Problem**: Users must grant microphone permission
- **Solution**:
  1. Click the lock icon (🔒) in browser address bar
  2. Find "Microphone" setting
  3. Change to "Allow"
  4. Refresh the page

### 3. **Browser Compatibility** 🌐
- **Best Support**: Chrome, Edge (Chromium-based)
- **Good Support**: Safari (iOS/macOS)
- **Limited Support**: Firefox
- **Not Supported**: Internet Explorer

### 4. **Background Noise Issues** 🔊

#### Common Causes:
- **Ambient noise**: Traffic, people talking, music
- **Echo**: Sound bouncing in room
- **Poor microphone**: Low-quality or far from speaker
- **Network issues**: Unstable internet connection

#### Solutions:
✅ **Environment**:
- Use a quiet room
- Close windows/doors
- Turn off TV/music
- Move away from fans/AC units

✅ **Microphone Technique**:
- Position 6-12 inches from mouth
- Speak directly toward microphone
- Use headset/external mic for better quality
- Avoid covering phone/laptop mic with hand

✅ **Speaking Style**:
- Speak clearly and at moderate pace
- Don't whisper or shout
- Pause briefly between sentences
- Articulate words (especially medical terms)

✅ **Technical**:
- Use Chrome or Edge browser
- Ensure stable internet (WiFi or cellular)
- Close other apps using microphone
- Restart browser if issues persist

### 5. **Recognition Stops Unexpectedly** ⏸️
- **Problem**: Recognition auto-stops after silence
- **Solution**: Our code now auto-restarts recognition
- **User Action**: Keep speaking or click Stop and restart

### 6. **Deployment-Specific Issues** 🚀

#### Check These:
1. **Vercel Configuration**:
   ```json
   {
     "headers": [
       {
         "key": "Permissions-Policy",
         "value": "microphone=(self)"
       }
     ]
   }
   ```

2. **Environment Variables**: Ensure all API keys are set in Vercel dashboard

3. **Domain Issues**: Custom domains must have valid SSL

4. **Regional Restrictions**: Some regions may block certain APIs

### 7. **Testing Checklist** ✅

Before deploying, test:
- [ ] HTTPS is enabled
- [ ] Microphone permission prompt appears
- [ ] Permission is saved after granting
- [ ] Recognition starts when clicking mic button
- [ ] Text appears in real-time (interim results)
- [ ] Final text is saved when speaking stops
- [ ] Multiple recordings work consecutively
- [ ] Different languages work correctly
- [ ] Mobile devices work (iOS/Android Chrome)

### 8. **Error Messages** ❌

| Error | Cause | Solution |
|-------|-------|----------|
| `not-allowed` | Permission denied | Grant microphone access in browser settings |
| `no-speech` | No voice detected | Speak louder, reduce noise, check mic |
| `network` | Internet issue | Check connection, try again |
| `aborted` | User stopped | Normal - no action needed |
| `audio-capture` | Mic unavailable | Close other apps using mic |
| `not-found` | No microphone | Check hardware connection |

### 9. **Mobile Considerations** 📱

#### iOS (Safari):
- Works on iOS 14.3+
- Requires HTTPS
- May need user to tap screen first (user gesture)

#### Android (Chrome):
- Works well on Android 7+
- Ensure Chrome app permissions include microphone
- Check system-level microphone permissions

### 10. **Debug Mode** 🔍

To see what's happening:
1. Open browser console (F12)
2. Look for console.log messages:
   - "Speech confidence: X" (0-1, higher is better)
   - Error messages with details
3. Low confidence (<0.7) = poor audio quality/noise

### 11. **Performance Tips** ⚡

- **Language Selection**: Choose correct language for better accuracy
- **Medical Terms**: Speak slowly for complex medical terminology
- **Short Phrases**: Recognition works better with shorter utterances
- **Review**: Always review transcribed text before submitting

### 12. **When It Still Doesn't Work** 🆘

Try this checklist:
1. ✅ Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. ✅ Clear browser cache and cookies
3. ✅ Try incognito/private browsing mode
4. ✅ Try different browser (Chrome recommended)
5. ✅ Check microphone works in other apps
6. ✅ Update browser to latest version
7. ✅ Restart device
8. ✅ Check browser console for errors

### Support Resources 📚

- **Browser Settings**: chrome://settings/content/microphone
- **Test Microphone**: https://www.onlinemictest.com/
- **Browser Compatibility**: https://caniuse.com/speech-recognition

---

## For Developers 👨‍💻

### Code Improvements Made:

1. **HTTPS Check**: Added validation for secure connection
2. **Auto-restart**: Recognition continues after interruptions
3. **Better Error Handling**: Specific messages for each error type
4. **Confidence Logging**: Monitor speech recognition quality
5. **Multiple Alternatives**: Better accuracy with maxAlternatives=3
6. **Explicit Permissions**: Request getUserMedia before starting
7. **Language Updates**: Dynamic language switching
8. **User Feedback**: Visual indicators and helpful tips

### Testing in Production:

```bash
# Test on actual device/network conditions
# Use Chrome DevTools Network throttling
# Test with different noise levels
# Test on mobile devices
# Monitor console for confidence scores
```

### Future Improvements:
- Add noise cancellation libraries
- Implement audio level monitoring
- Add voice activity detection (VAD)
- Support offline fallback
- Add speech synthesis for responses
