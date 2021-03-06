const nn = navigator.ml.getNeuralNetworkContext();
const assert = chai.assert;
let options = {};
const EPISILON = 1e-5;
const EPISILON5ULP = 5.0 * 0.0009765625;
const EPISILONQUANT8 = 1;
let episilonCTS = EPISILON;
let episilonCTSQuant8 = EPISILONQUANT8;
// refer to https://android.googlesource.com/platform/frameworks/ml/+/master/nn/runtime/test/TestGenerated.cpp#117
let rtol = 5.0 * 1.1920928955078125e-7;

function product(array) {
  return array.reduce((accumulator, currentValue) => accumulator * currentValue);
}

function almostEqual(a, b, episilon=1e-6, rtol=5.0*1.1920928955078125e-7) {
  let delta = Math.abs(a - b);
  if (delta <= episilon + rtol * Math.abs(b)) {
    return true;
  } else {
    console.warn(`a(${a}) b(${b}) delta(${delta})`);
    return false;
  }
}

function almostEqualRM(a, b) {
  let delta = Math.abs(a - b);
  // refer to https://github.com/onnx/onnx/blob/master/onnx/backend/test/case/model/__init__.py#L49
  if (delta <= 1e-7 + 1e-3 * Math.abs(b)) {
    return true;
  } else {
    console.warn(`a(${a}) b(${b}) delta(${delta})`);
    return false;
  }
}

function almostEqualCTS(a, b) {
  return almostEqual(a, b, episilonCTS)
}

function almostEqualCTSQuant8(a, b) {
  return almostEqual(a, b, episilonCTSQuant8, 0)
}

function setOptionsPerLayer() {
    // visit URL(http://domain-name/test/index.html?prefer=fast/sustained/low)
    var parameterStr = window.location.search.substr(1);
    var reg = new RegExp("(^|&)prefer=([^&]*)&iterations=([^&]*)&API=([^&]*)&platform=([^&]*)&supportSwitch=([^&]*)(&|$)", "i");
    var r = parameterStr.match(reg);
    var macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    var windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    if (r != null) {
      var prefer = unescape(r[2]).toLowerCase();
      var iterations = unescape(r[3]).toLowerCase();
      if (navigator.ml.isPolyfill) {
        if (prefer === "fast") {
          options = {
            "backend": 'WASM',
            "prefer": 'fast',
            'iterations': iterations
          };
        } else if (prefer === "sustained") {
          options = {
            "backend": 'WebGL',
            "prefer": 'sustained',
            'iterations': iterations
          };
        }
      } else {
        if (prefer === "sustained") {
          // use PREFER_SUSTAINED_SPEED for Linux/Windows clDNN backend
          prefer = nn.PREFER_SUSTAINED_SPEED;
          options = {
            "backend": 'WebML',
            "prefer": 'sustained',
            'iterations': iterations
          };
          // As MPS computes on FP16, use 5ULP of FP16 range
          if (macosPlatforms.indexOf(navigator.platform) !== -1 || windowsPlatforms.indexOf(navigator.platform) !== -1) {
            episilonCTS = EPISILON5ULP;
            rtol = EPISILON5ULP;
          }
        } else if (prefer === "fast") {
          // use PREFER_FAST_SINGLE_ANSWER for Linux/Windows mkldnn backend
          prefer = nn.PREFER_FAST_SINGLE_ANSWER;
          options = {
            "backend": 'WebML',
            "prefer": 'fast',
            'iterations': iterations
          };
        } else if (prefer === "low") {
          prefer = nn.PREFER_LOW_POWER;
          options = {
            "backend": 'WebML',
            "prefer": 'low',
            'iterations': iterations
          };
        } else if (prefer === "ultra-low") {
          prefer = nn.PREFER_ULTRA_LOW_POWER;
          options = {
            "backend": 'WebML',
            "prefer": 'ultra-low',
            'iterations': iterations
          };
        }
      }
    }
  }

function setOptions() {
  // visit URL(http://domain-name/test/index.html?prefer=fast/sustained/low)
  const parameterStr = new URLSearchParams(location.search);
  let prefer = parameterStr.get('prefer');

  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];

  if (navigator.ml.isPolyfill) {
    if (prefer === "fast") {
      options = {
        "backend": 'WASM',
        "prefer": 'fast',
        'iterations': "1"
      };
    } else if (prefer === "sustained") {
      const webgpu = parameterStr.get('webgpu');
      if (webgpu !== null && webgpu === 'true') {
        options = {
          "backend": 'WebGPU',
          "prefer": 'sustained',
          'iterations': "1"
        };
      } else {
        options = {
          "backend": 'WebGL',
          "prefer": 'sustained',
          'iterations': "1"
        };
      }
    }
  } else {
    if (prefer === "sustained") {
      // use PREFER_SUSTAINED_SPEED for Linux/Windows clDNN backend
      prefer = nn.PREFER_SUSTAINED_SPEED;
      options = {
        "backend": 'WebML',
        "prefer": 'sustained',
        'iterations': "1"
      };
      // As MPS computes on FP16, use 5ULP of FP16 range
      if (macosPlatforms.indexOf(navigator.platform) !== -1 || windowsPlatforms.indexOf(navigator.platform) !== -1) {
        episilonCTS = EPISILON5ULP;
        rtol = EPISILON5ULP;
      }
    } else if (prefer === "fast") {
      // use PREFER_FAST_SINGLE_ANSWER for Linux/Windows mkldnn backend
      prefer = nn.PREFER_FAST_SINGLE_ANSWER;
      options = {
        "backend": 'WebML',
        "prefer": 'fast',
        'iterations': "1"
      };
    } else if (prefer === "low") {
      prefer = nn.PREFER_LOW_POWER;
      options = {
        "backend": 'WebML',
        "prefer": 'low',
        'iterations': "1"
      };
    } else if (prefer === "ultra-low") {
      prefer = nn.PREFER_ULTRA_LOW_POWER;
      options = {
        "backend": 'WebML',
        "prefer": 'ultra-low',
        'iterations': "1"
      };
    }
  }
}

function getPreferenceCode(preferenceStr) {
  let prefer;
  if (preferenceStr === 'sustained') {
    prefer = nn.PREFER_SUSTAINED_SPEED;
  } else if (preferenceStr === 'fast') {
    prefer = nn.PREFER_FAST_SINGLE_ANSWER;
  } else if (preferenceStr === 'low') {
    prefer = nn.PREFER_LOW_POWER;
  } else if (preferenceStr === 'ultra-low') {
    prefer = nn.PREFER_ULTRA_LOW_POWER;
  }else {
    console.error('Invalid preference string.');
  }
  return prefer;
}


// loadUrl and loadTensor functions are for end2end test cases
async function loadUrl(url) {
  return new Promise(resolve => {
    let request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = _ => {
      if (request.readyState === 4 && request.status === 200)
        resolve(new Uint8Array(request.response));
    };
    request.send();
  });
}

async function loadTensor(tensorFile) {
  let result = await loadUrl(tensorFile);
  if (onnx.TensorProto.verify(result))
    throw new Error(`Invalid tensor`);
  let tensor = onnx.TensorProto.decode(result);
  return getTensorData(tensor);
}

async function assertThrowsAsync(fn, regExp) {
  let f = () => {};
  try {
    await fn();
  } catch(e) {
    f = () => {throw e};
  } finally {
    assert.throws(f, regExp);
  }
}

async function assertDoesNotThrowAsync(fn, regExp) {
  let f = () => {};
  try {
    await fn();
  } catch(e) {
    f = () => {throw e};
  } finally {
    assert.doesNotThrow(f, regExp);
  }
}

function checkOutput(output, expected) {
  assert.isTrue(output.length === expected.length);
  for (let i = 0; i < output.length; ++i) {
    assert.isTrue(almostEqualCTS(output[i], expected[i]));
  }
}
