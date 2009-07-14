(ns com.ashafa.swish
  (:require [clojure.contrib.json.read :as json-read]
            [clojure.contrib.duck-streams :as streams])
  (:import (java.io StringReader PushbackReader)
           (org.mozilla.javascript ContextFactory Context ScriptableObject ImporterTopLevel)))


(def custom-factory (proxy [ContextFactory][]
                      (hasFeature 
                       [context featureIndex]
                       (if (= featureIndex Context/FEATURE_DYNAMIC_SCOPE)
                         true (proxy-super hasFeature context featureIndex)))))

(def cx (.enterContext custom-factory))
(.setLanguageVersion cx 170)

(try
 (def shared-scope (.initStandardObjects cx))
 (ScriptableObject/putProperty shared-scope "$out" (Context/javaToJS System/out shared-scope))
 (.evaluateString cx shared-scope "function print(msg){$out.println(msg||'null');}" "stub" 1 nil)
 (.evaluateString cx shared-scope (slurp "env.rhino.js") "env.js" 1 nil)
 (.evaluateString cx shared-scope (slurp "json2.js") "json2.js" 1 nil)
 (.evaluateString cx shared-scope (slurp "init.js") "init.js" 1 nil)
 (.evaluateString cx shared-scope (slurp "sizzle.js") "sizzle.js" 1 nil)
 (finally
  (Context/exit)))

(defn swish
  ([url selector]
     (swish url selector false))
  ([url selector with-children]
     (let [cx (.enterContext custom-factory)]
       (try
        (let [thread-scope (.newObject cx shared-scope)]
          (doto thread-scope
            (.setPrototype shared-scope)
            (.setParentScope nil))
          (let [load-js    #(.evaluateString cx thread-scope (slurp %) % 1 nil)
                swish-obj  (.get shared-scope "swish" thread-scope)
                swish-find (.get swish-obj "find" thread-scope)]
            (ScriptableObject/putProperty thread-scope "$load" (Context/javaToJS load-js thread-scope))
            (binding [json-read/*json-keyword-keys* true]
              (json-read/read-json 
               (PushbackReader.
                (StringReader. (.call swish-find cx thread-scope thread-scope (to-array [url selector with-children]))))))))
        (finally
         (Context/exit))))))