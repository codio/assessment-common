window.codioAssessmentsHelper = window.codioAssessmentsHelper || {}

const ICONS = {
  progress: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity="0.25"/><path fill="currentColor" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m9 20.42l-6.21-6.21l2.83-2.83L9 14.77l9.88-9.89l2.83 2.83z"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20 6.91L17.09 4L12 9.09L6.91 4L4 6.91L9.09 12L4 17.09L6.91 20L12 14.91L17.09 20L20 17.09L14.91 12z"/></svg>`,
  percent: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m18.5 3.5l-15 15l2 2l15-15M7 4a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m10 10a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"/></svg>`
}


window.codioAssessmentsHelper.METHODS = {
  GET_SETTINGS: 'assessments.getSettings',
  GET_SETTINGS_RESPONSE: 'assessments.getSettings.response',
  EXPORT_SETTINGS: 'assessments.exportSettings',
  EXPORT_SETTINGS_RESPONSE: 'assessments.exportSettings.response',
  GET_STYLES: 'assessments.getStyles',
  GET_STYLES_RESPONSE: 'assessments.getStyles.response',
  GET_STATE: 'assessments.getState',
  GET_STATE_RESPONSE: 'assessments.getState.response',
  SET_STATE: 'assessments.setState',
  SET_HEIGHT: 'assessments.setHeight',
  GET_CONTENT: 'assessments.getContent',
  SET_CONTENT: 'assessments.setContent',
  CALLBACK: 'assessments.callback',
  SUBMIT_ANSWER: 'assessments.submitAnswer',
  RESET: 'assessments.reset',
  MODIFY: 'assessments.modify',
  UNBLOCK: 'assessments.unblock',
}

window.codioAssessmentsHelper.States = {
  FAIL: 'fail',
  PASS: 'pass',
  RESET: 'reset',
  PROGRESS: 'progress',
  PENDING: 'pending'
}

window.codioAssessmentsHelper.RESULT_STATUS = {
  PROGRESS: 'progress',
  FAILED: 'failed',
  PASSED: 'passed',
  PARTIAL: 'partial',
}

window.codioAssessmentsHelper.PreviewType = {
  NONE: 'NONE',
  MARKDOWN: 'MARKDOWN',
  RAW: 'RAW'
}

window.codioAssessmentsHelper.callbacks = {}

window.codioAssessmentsHelper.deferred = () => {
  let resolve, reject
  const promise = new Promise((resolveF, rejectF) => {
    resolve = resolveF
    reject = rejectF
  })
  return { resolve, reject, promise }
}

window.codioAssessmentsHelper.send = (methodName, data) => {
  const id = window.location.hash.substring(1)
  console.log('assessment iframe send', methodName, data)
  window.parent.postMessage(JSON.stringify({id, method: methodName, data}), '*')
}

window.codioAssessmentsHelper.sendAndWait = (methodName, data = {}) => {
  const id = `id_${Date.now()}`
  const dfd = window.codioAssessmentsHelper.deferred()
  window.codioAssessmentsHelper.callbacks[id] = (data) => data && data.error ? dfd.reject(new Error(data.error)) : dfd.resolve(data)
  data.callbackId = id
  window.codioAssessmentsHelper.send(methodName, data)
  return dfd.promise
}

window.codioAssessmentsHelper.processCallback = (data) => {
  if (!data) {
    return
  }
  const {callbackId, ...result} = data
  window.codioAssessmentsHelper.callbacks[callbackId] && window.codioAssessmentsHelper.callbacks[callbackId](result)
}

window.codioAssessmentsHelper.registerMessageListener = listener => {
  window.addEventListener(
    'message',
    (event) => {
      listener(event.data)
    },
    false
  )
}

window.codioAssessmentsHelper.getBodyHeight = () => {
  const body = document.body
  const html = document.documentElement
  return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
}

window.codioAssessmentsHelper.addBodyHeightListener = () => {
  const debounceSetHeight = window.codioAssessmentsHelper.debounce(() => {
    window.codioAssessmentsHelper.send(
      window.codioAssessmentsHelper.METHODS.SET_HEIGHT, {height: window.codioAssessmentsHelper.getBodyHeight()})
  }, 100)
  const resizeObserver = new ResizeObserver(debounceSetHeight)
  resizeObserver.observe(document.body)
}

window.codioAssessmentsHelper.addStyle = (() => {
  const style = document.createElement('style')
  document.head.append(style)
  return (styleString) => style.textContent = styleString
})()

window.codioAssessmentsHelper.debounce = (func, timeout) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

window.codioAssessmentsHelper.getButtonCaption = (assessmentOptions, maxAttemptsCount) => {
  const {usedAttempts, buttonCaption} = assessmentOptions
  let caption = buttonCaption
  if (maxAttemptsCount) {
    const attemptsLeftCount = usedAttempts < maxAttemptsCount ? maxAttemptsCount - usedAttempts : 0
    const attemptsLeft = attemptsLeftCount ? ` (${attemptsLeftCount} left)` : ''
    caption = `${caption}${attemptsLeft}`
  }
  return caption
}

window.codioAssessmentsHelper.calculateGuidance = (
  authoringMode,
  showAsTeacher,
  answered,
  {showGuidanceAfterResponseOption, guidance, points},
  {answerGuidance, answerPoints, attemptsCount, passed, isCompletedAndReleased}
) => {
  if (authoringMode) {
    let showGuidanceAfterResponse = false
    if (!showGuidanceAfterResponseOption) {
      showGuidanceAfterResponse = false
    } else if (showGuidanceAfterResponseOption.type === 'Always') {
      showGuidanceAfterResponse = true
    } else if (showGuidanceAfterResponseOption.type === 'Attempts') {
      showGuidanceAfterResponse = attemptsCount >= showGuidanceAfterResponseOption.passedFrom || passed
    } else if (showGuidanceAfterResponseOption.type === 'Score' && answered) {
      showGuidanceAfterResponse = points <= 0 ||
        (answerPoints * 100 / points) >= showGuidanceAfterResponseOption.passedFrom
    } else if (showGuidanceAfterResponseOption.type === 'WhenGradesReleased') {
      showGuidanceAfterResponse = true
    }
    return showAsTeacher || answered && showGuidanceAfterResponse ? guidance : ''
  }

  // for student, it is calculated on server side
  let showGuidance = answered
  if (showGuidanceAfterResponseOption?.type === 'WhenGradesReleased') {
    showGuidance = answered && isCompletedAndReleased
  }

  return showAsTeacher ? guidance : (showGuidance ? answerGuidance : '')
}

window.codioAssessmentsHelper.isCanAnswerAgain = (assessment, result) => {
  const usedAttempts = result?.usedAttempts
  return !assessment.source.maxAttemptsCount || usedAttempts < assessment.source.maxAttemptsCount
}

const getAssignmentSettings = (assignment) => {
  return assignment.projectBased?.settings || assignment.bookBased?.settings
}

window.codioAssessmentsHelper.calculateCompletedAndReleased = (eduStartedAssignmentInfo) => {
  if (!eduStartedAssignmentInfo) {
    return false
  }

  const { assignment, started } = eduStartedAssignmentInfo

  return (
    started?.completed?.completedAt &&
    getAssignmentSettings(assignment).releaseGrades
  )
}

window.codioAssessmentsHelper.calculateShowExpectedAnswer = (
  eduStartedAssignment, showExpectedAnswerOption
) => {
  const authoringMode = !eduStartedAssignment
  const isCompletedAndReleased = window.codioAssessmentsHelper.calculateCompletedAndReleased(eduStartedAssignment)
  let showExpectedAnswer = false
  if (authoringMode) {
    if (!showExpectedAnswerOption || showExpectedAnswerOption.type === 'Never') {
      showExpectedAnswer = false
    } else if (showExpectedAnswerOption.type === 'Always' || showExpectedAnswerOption.type === 'WhenGradesReleased') {
      showExpectedAnswer = true
    }
    return showExpectedAnswer
  }
  if (!showExpectedAnswerOption || showExpectedAnswerOption.type === 'Never') {
    showExpectedAnswer = false
  } else if (showExpectedAnswerOption.type === 'Always') {
    showExpectedAnswer = true
  } else if (showExpectedAnswerOption.type === 'WhenGradesReleased') {
    showExpectedAnswer = isCompletedAndReleased
  }
  return showExpectedAnswer
}

window.codioAssessmentsHelper.isPartiallyCorrect = (source, result, processing) => {
  if (!result) {
    return false
  }
  const state = processing ? window.codioAssessmentsHelper.States.PROGRESS : result.state
  const {points} = result
  const isCorrect = state === window.codioAssessmentsHelper.States.PASS
  const hasPartialPoints = isCorrect && points > 0 && points < source.points
  return source.arePartialPointsAllowed && hasPartialPoints
}

window.codioAssessmentsHelper.getAssessmentResultStatus = (source, result, processing) => {
  const state = processing ? window.codioAssessmentsHelper.States.PROGRESS : result?.state
  if (state === window.codioAssessmentsHelper.States.PROGRESS) {
    return window.codioAssessmentsHelper.RESULT_STATUS.PROGRESS
  }
  const partial = window.codioAssessmentsHelper.isPartiallyCorrect(source, result, processing)
  if (partial) {
    return window.codioAssessmentsHelper.RESULT_STATUS.PARTIAL
  }
  switch (state) {
    case window.codioAssessmentsHelper.States.PASS:
      return window.codioAssessmentsHelper.RESULT_STATUS.PASSED
    case window.codioAssessmentsHelper.States.FAIL:
      return window.codioAssessmentsHelper.RESULT_STATUS.FAILED
    default:
      return null
  }
}

window.codioAssessmentsHelper.getIconByResultStatus = (status) => {
  switch (status) {
    case window.codioAssessmentsHelper.RESULT_STATUS.PROGRESS:
      return ICONS.progress
    case window.codioAssessmentsHelper.RESULT_STATUS.FAILED:
      return ICONS.close
    case window.codioAssessmentsHelper.RESULT_STATUS.PASSED:
      return ICONS.check
    case window.codioAssessmentsHelper.RESULT_STATUS.PARTIAL:
      return ICONS.percent
    default:
      return ''
  }
}

window.codioAssessmentsHelper.escapeHTML = (unsafe) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
