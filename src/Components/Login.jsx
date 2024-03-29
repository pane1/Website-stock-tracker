import React, { useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import "./Login.css"
import axios from "axios";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"

function Login() {
  //Hooks
  useEffect(() => {
    document.title = "Login"
  });

  const { login } = useAuth()
  const navigate = useNavigate()

  //States 
  const [input, setInput] = useState({
    user: '',
    pass: ''
  })
  const emailRef = useRef()
  const passRef = useRef()

  const [successBox, setSucessBoxVis] = useState(false);
  const [lockStatus, setLock] = useState();
  const [cursorType, setCursor] = useState("pointer")
  const [errorMsg, setErrorMsg] = useState("");

  function formInput(e) {
    const { name, value } = e.target
    setInput(() => ({ ...input, [name]: value }))
  }

  async function formSubmit(e) {
    e.preventDefault();
    /*
    const newUser = {
      Email: input.user,
      Password: input.pass
    }
    axios.post("http://localhost:3001/login", newUser)
      .then(res => {
        if (res.data.error == 1) {
          setMessage(res.data.errorMessage);
          setMessageBoxVis(true);
        }
        else {
          setMessage("");
          setMessageBoxVis(false);
          setSucessBoxVis(true);
          setTimeout(function () {
            setSucessBoxVis(false);
          }, 3000)
        }
      })
      */

    console.log("Form submitted")

    try {
      setErrorMsg("")
      setLock(true)
      setCursor("wait")
      await login(emailRef.current.value, passRef.current.value)
      navigate('/')

    }
    catch (error) {
      if (error.code == "auth/user-not-found") {
        setErrorMsg("User not found, please try again.");
      }
      else {
        setErrorMsg("Invalid Email/Password, please try again.");
      }
    }
    setLock(false)
    setCursor("pointer")
  }

  return (
    <div className="login-container">
      <div className="login-section">
        {!successBox && (
          <div className="login">
            <div className="login-form-title">
              <p style={{ margin: 0 }}>
                Login
              </p>
            </div>
            <form onSubmit={formSubmit}>
              <input
                ref={emailRef}
                onChange={formInput}
                className="login-input-form"
                placeholder="Email"
                name='user'
                value={input.user}
                autoComplete="off"
                type="text"
              />
              <input
                ref={passRef}
                onChange={formInput}
                className="login-input-form"
                placeholder="Password"
                name="pass"
                value={input.pass}
                autoComplete="off"
                type="password"
              />
              <a className="forget-option">
                Forget password?
              </a>
              <button
                disable={lockStatus}

                className="login-button"
                style={{ cursor: { cursorType } }}
                type="submit"
              >
                Login
              </button>
            </form>
            <p className="login-text">
              Don't have an account?
              <Link className="sign-up-option" exact={true} to="/sign-up">
                Sign-up
              </Link>
            </p>
            {errorMsg != "" && (
              <div className="error-messageBox">
                <p className="errorMessage">
                  {errorMsg}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;