import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
class AppErrorBoundary extends React.Component<React.PropsWithChildren,{error:Error|null}>{
  state={error:null as Error|null}
  static getDerivedStateFromError(error:Error){return {error}}
  componentDidCatch(error:Error){console.error('Sloboda render error',error)}
  render(){return this.state.error?<main style={{padding:32}}><h1>Aplikáciu sa nepodarilo zobraziť</h1><pre>{this.state.error.message}</pre></main>:this.props.children}
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><AppErrorBoundary><App/></AppErrorBoundary></React.StrictMode>)
