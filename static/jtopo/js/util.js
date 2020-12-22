/**
 * 获取系统路径
 * @type {{getRootPath: SysUtil.getRootPath}}
 */
var SysUtil = {
    getRootPath: function () {
        // 获取当前网址，如： http://localhost:8083/uimcardprj/share/meun.jsp
        var curWwwPath = window.document.location.href
        // 获取主机地址之后的目录，如： uimcardprj/share/meun.jsp
        var pathName = window.document.location.pathname
        var pos = curWwwPath.indexOf(pathName, 7)
        // 获取主机地址，如： http://localhost:8083
        var localhostPath = curWwwPath.substring(0, pos)
        // 获取带"/"的项目名，如：/uimcardprj
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 2)
        return localhostPath + projectName
    }
}
// url根路径
var rootPath = SysUtil.getRootPath()
var topoImgPath = '/jtopo_topology/static/jtopo/img/'

/*
 * 生成uuid算法,碰撞率低于1/2^^122
 * @param x 0-9或a-f范围内的一个32位十六进制数
 */
function generateUUID() {
    var d = new Date().getTime()
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    return uuid
}

/**
 * 计算程序执行时间
 * @type {{startTime: {}, timeSpan: number, start: Timer.start, stop: Timer.stop, getTimeSpan: Timer.getTimeSpan}}
 */
var Timer = {
    startTime: {},
    stoppedStatus: true,
    start: function () {
        if (this.stoppedStatus) {
            this.startTime = new Date()
            this.stoppedStatus = false
        }
    },
    pause: function () {
        var startTime = this.startTime
        if (startTime) {
            return new Date() - startTime
        } else {
            return -1
        }
    },
    stop: function () {
        var startTime = this.startTime
        if (startTime) {
            this.stoppedStatus = true
            return new Date() - startTime
        } else {
            this.stoppedStatus = true
            return -1
        }
    }
}

let images = [
    './static/jtopo/img/icon_fair.png',
    './static/jtopo/img/icon_firewall.png',
    './static/jtopo/img/icon_proxy_server.png',
]
/**
 * 节点类型，可以得到一些关于节点的东西
 * jTopoNodeName 是 初始化 node 的函数名
 * toggleModal 是 对应 编辑框 的 模态窗口
 * formNamePrefix: 对应前缀
 * formNameEditArr: 对应编辑的选项，一般是指我们让他编辑的属性值，这些属性值都会直接赋值到对应的node节点上，所以命名一定不要出错！！
 * nodeInit: 节点初始化函数，一般是一些节点需要设置一些方法，或者我们自定义的一些节点，逻辑一般都在里面
 */
var typeMap = new Map([
        [
            'text', {
                jTopoNodeName: 'TextNode',
                toggleModal: () => $('#text_edit').modal('toggle'),
                prefix: 'text_edit_',
                formNameEditArr: ['text', 'fontColor'], // 对应需要编辑的选项
            }
        ],
        [
            'image', {
                jTopoNodeName: 'Node',
                toggleModal: () => $('#image_edit').modal('toggle'),
                prefix: 'image_edit_',
                formNameEditArr: [], // 对应需要编辑的选项
                nodeInit: function (node, params = {}) {
                    node.setImage(images[Math.floor(Math.random() * images.length)])
                }
            }
        ],
        [
            'interface', {
                jTopoNodeName: 'Node',
                toggleModal: () => $('#interface_edit').modal('toggle'),
                prefix: 'interface_edit_',
                formNameEditArr: [], // 对应需要编辑的选项
                nodeInit: function (node, params) {
                    node.setImage(images[Math.floor(Math.random() * images.length)])
                }
            }
        ],
        [
            'circle', {
                jTopoNodeName: 'Node',
                toggleModal: () => $('#circle_edit').modal('toggle'),
                prefix: 'circle_edit_',
                formNameEditArr: [], // 对应需要编辑的选项
                nodeInit: function (node, params) {
                    // node.text = 'asdsad'
                    // node.zIndex = -1
                    node.__type = 'circle'
                    node.paint = function(g) {
                        g.beginPath();
                        // g.moveTo(0,0);
                        g.fillStyle = 'rgba(255, 0, 0, 0.25)';
                        // g.strokeStyle = "blue";
                        // g.fillStyle = 'rgba(255,255,255,0)'
                        let minRadius = node.width >= node.height ? node.height : node.width
                        g.arc(0, 0, minRadius / 2,0, Math.PI*2);
                        g.fill();
                        g.closePath();

                        g.restore()
                        // this.paintText(g);
                    }
                }
            }
        ],
    ]
)

// function nodeAddEdit(edit, type,self) {
//   if (!edit) typeMap.get(type) && editFormSubmit(type,self.scene)
//   else {
//     // 编辑的时候
//     let selectedElements = self.scene.selectedElements
//     formAssignment(selectedElements[0], type, false)
//   }
//   typeMap.get(type) && typeMap.get(type).toggleModal()
// }
// /**
//  * 根据 type 生成对应的节点
//  * @param type
//  */
// function editFormSubmit(type,scene) {
//   let typeOption = typeMap.get(type)
//   let option = {}
//
//   let form = $(`#${typeOption.prefix + 'form'}`)
//   if (!form) return console.warn(`不存在对应的表单名：${typeOption.prefix + 'form'}`)
//
//   form.serializeArray().forEach(item => {
//     let current = prefixSelectVariable(typeOption.prefix,item.name)
//     if (current && typeOption.formNameEditArr.includes(current))
//       option[current] = item.value
//   })
//   form[0].reset()
//   console.log('表单配置',option)
//   newNode(type,scene)(option)
// }
var prefixSelectVariable = (prefix, str) => str.indexOf(prefix) === 0 ? str.slice(prefix.length) : undefined

// /**
//  * 根据类型，生成节点，并在场景中添加节点
//  * @param type
//  * @param scene 默认节点
//  * @returns {(function(...[*]=))|void}
//  */
// function newNode(type,scene) {
//   const typeOption = typeMap.get(type) // 获取类型
//   if (!typeOption) return console.warn(`对应节点类型不存在，type: ${type}`)
//   return function (nodeOption) {
//     if (!nodeOption) return console.warn(`不能创建一个不存在配置的 ${type}节点！`);
//     let node = new JTopo[`${typeOption.jTopoNodeName}`]() // 初始化 节点
//     node.setLocation(100,100) // 设置 坐标
//     for (let optionKey in nodeOption) { // 根据配置直接赋值，这里就十分要求 配置 的属性名必须和 节点 的属性名保持一致
//       node[optionKey] = nodeOption[optionKey]
//     }
//     typeof typeOption.nodeInit === 'function' && typeOption.nodeInit(node) // 执行一些方法
//     // nodeMap.set(node._id,{node,type,selected: false})
//     console.log(scene)
//     console.log(node)
//     scene.add(node) // 添加到场景
//   }
// }
//
//
// /**
//  * 表单和节点之间相互赋值，edit 的时候发生
//  * @param node 节点
//  * @param type 节点类型
//  * @param positive bool true node节点赋值给 表单，false 则相反
//  */
// function formAssignment(node, type, positive = true) {
//   let typeOption = typeMap.get(type)
//   let form = $(`#${typeOption.prefix + 'form'}`)
//   if (!form) return console.warn(`不存在这个表单 ${typeOption.prefix + 'form'}`)
//
//   typeOption.formNameEditArr.forEach(item => {
//     if (positive) {
//       form.find(`input[name=${typeOption.prefix + item}]`).val(node[item])
//     } else {
//       node[item] = form.find(`input[name=${typeOption.prefix + item}]`).val()
//       form[0].reset()
//     }
//   })
// }
