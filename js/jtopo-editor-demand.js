/// 删减掉 jtopo-editor 一些不必要的功能

/**
 * 基于jtopo-editor.js的二次封装
 * designed by wenyuan
 * github: https://github.com/winyuan/jtopo_topology
 */

/**
 * 提供拓扑图面板相关操作的函数集，编辑器继承其全部功能
 */
function TopologyPanel() {
}

/**
 * 保存序列化的拓扑图JSON数据到服务器
 */
TopologyPanel.prototype.saveTopology = function (url) {
    editor.mainMenu.hide()
    let self = this
    // 保存container状态
    let containers = editor.utils.getContainers()
    for (let c = 0; c < containers.length; c++) {
        let temp = []
        let nodes = containers[c].childs
        for (let n = 0; n < nodes.length; n++) {
            if (nodes[n] instanceof JTopo.Node) {
                temp.push(nodes[n].nodeId)
            }
        }
        containers[c].childNodes = temp.join(',')
    }
    alert(editor.stage.toJson())
}

/**
 * 重置拓扑图
 */
TopologyPanel.prototype.resetTopology = function (url) {
    // editor.stageMode = 'edit'
    // this.replaceStage(url)
}

/**
 * 加载指定id的拓扑图JSON数据结构
 * @param topologyGuid 拓扑 表记录ID
 * @param backImg 拓扑图的背景图片
 */
TopologyPanel.prototype.loadTopology = function (url, topologyGuid, backImg) {
    $.ajax({
        type: 'GET',
        url: url,
        async: false,
        contentType: 'application/json',
        dataType: 'json',
        error: function () {
            // alert('服务器异常，请稍后重试..')
        },
        success: function (response) {
            // 错误处理
            if (response.code !== 200) {
                console.error(response.msg)
            } else if (response.code === 200 && $.isEmptyObject(response.data.topology_json)) {
                // 拓扑不存在,创建一个空白的拓扑图
                let initTopologyJson = {
                    'version': '0.4.8',
                    'wheelZoom': 0.95,
                    'width': 972,
                    'height': 569,
                    'id': 'ST172.19.105.52015100809430700001',
                    'childs': [
                        {
                            'elementType': 'scene',
                            'id': 'S172.19.105.52015100809430700002',
                            'translateX': -121.82,
                            'translateY': 306.72,
                            'scaleX': 1.26,
                            'scaleY': 1.26,
                            'childs': []
                        }
                    ]
                }
                editor.init(topologyGuid, backImg, initTopologyJson, '')
            } else {
                // 拓扑存在,渲染拓扑图
                let topologyJson = response.data.topology_json
                editor.init(topologyGuid, backImg, topologyJson, '')
            }
        }
    })
}

/**
 * 传入JSON形式的拓扑图数据,绘制拓扑图。如果数据结构不正确,返回空拓扑图
 * @param topologyJson json形式的拓扑结构数据
 * @param backImg 拓扑图的背景图片
 */
TopologyPanel.prototype.loadTopologyByJson = function (topologyJson, backImg) {
    try {
        JTopo.replaceStageWithJson(topologyJson)
        if (editor.stage && editor.scene && editor.scene.childs && editor.scene.childs.length > 0) {
            editor.stage.centerAndZoom()
        }
    } catch (e) {
        console.error(e)
        let initTopologyJson = {
            'version': '0.4.8',
            'wheelZoom': 0.95,
            'width': 972,
            'height': 569,
            'id': 'ST172.19.105.52015100809430700001',
            'childs': [
                {
                    'elementType': 'scene',
                    'id': 'S172.19.105.52015100809430700002',
                    'translateX': -121.82,
                    'translateY': 306.72,
                    'scaleX': 1.26,
                    'scaleY': 1.26,
                    'childs': []
                }
            ]
        }
        JTopo.replaceStageWithJson(initTopologyJson)
        if (editor.stage && editor.scene && editor.scene.childs && editor.scene.childs.length > 0) {
            editor.stage.centerAndZoom()
        }
    }
}

/**
 * 清空所有节点
 */
TopologyPanel.prototype.deleteAllNodes = function () {
    editor.stage.childs.forEach(function (s) {
        s.clear()
    })
    // 连线重置
    editor.beginNode = null
    editor.link = null
}

class TopologyEditor {

    /**
     * 舞台
     * @type {JTopo.Stage}
     */
    stage = null

    /**
     * 场景
     * @type {JTopo.Scene}
     */
    scene = null

    /**
     * 添加节点 x 坐标
     * @type {number}
     */
    xInCanvas = 0
    /**
     * 添加节点 y 坐标
     * @type {number}
     */
    yInCanvas = 0

    config = {
        // 场景默认属性
        stageFrames: 500,

        // 线 默认属性
        linkStrokeColor: '#0066aa'.colorRgb(),
        lineDefaultWidth: 3,
    }

    /**
     * 当前模式
     * @type {string}
     */
    stageMode = 'select'
    /**
     * 默认连线类型
     * @type {string}
     */
    lineType = 'line'
    /**
     * 当前选择的节点对象
     * @type {JTopo.Node}
     */
    currentNode = null
    /**
     * 当前选择的线对象
     * @type {JTopo.Link}
     */
    currentLink = null


    /**
     * 主菜单
     * @type {*}
     */
    mainMenu = $('#main-menu')

    /**
     * 节点是否编辑
     * @type {boolean}
     */
    nodeEdit = false

    /**
     * 临时连线节点A
     * @type {JTopo.Node}
     */
    tempNodeA = (function(){
        let temp = new JTopo.Node('tempA')
        temp.setSize(1,1)
        return temp
    })()
    /**
     * 临时连线节点Z
     * @type {JTopo.Node}
     */
    tempNodeZ = (function(){
        let temp = new JTopo.Node('tempZ')
        temp.setSize(1,1)
        return temp
    })()
    /**
     * 临时连线节点
     * @type {JTopo.Link}
     */
    link = null
    /**
     * 连线起始记录节点
     * @type {JTopo.Node}
     */
    beginNode = null


    /**
     * 初始化
     * @param topologGuid {String} id
     * @param json {JSON} JSON序列
     * @param canvas {String} 画布id
     */
    init(topologGuid,json,canvas){
        if (topologGuid) console.error(`当前不存在主键`)
        this.topologyGuid = topologGuid

        let _canvas = document.getElementById(canvas)
        _canvas.width = $('body').width()
        _canvas.height = $('body').height()

        if (json) {
            this.stage = JTopo.createStageFromJson(json,_canvas)
            this.scene = this.stage.childs[0]
        } else {
            this.stage = new JTopo.Stage(_canvas)
            this.scene = new JTopo.scene(this.stage)
        }

        this.stage.frames = this.config.stageFrames // 帧数/秒
        this.stage.wheelZoom = null // 关闭鹰眼
        this.stage.mode = this.stageMode // 模式

        // 初始化一些事件
        this.initMenus()
        this.initDomEvent()
        this.initStageEvent()
        this.initSceneEvent()
    }

    /**
     * 初始化菜单栏事件
     */
    initMenus(){
        // 系统设置菜单
        this.mainMenu.on('click', function (event) {
            // 关闭菜单
            $(this).hide()
        })

        // 但凡是 主菜单下的 添加节点，都会打开一个添加的菜单
        this.mainMenu.on('click','div[data-type]',function(){
            let type = $(this).attr('data-type')
            $('.form_title').html(`添加${typeMap.get(type).label}`)
            this.nodeEdit = false
            typeMap.get(type) && typeMap.get(type).toggleModal()
        })
    }

    /**
     * 初始化 DOM 事件
     */
    initDomEvent(){
        // 监听全局键盘按下
        $(document).keydown(function(e) {
            if (e.which === 46) {
                console.log('按下 Delete')
            } else if (e.which === 17) {
                console.log('按下 Ctrl 键')
            }
            console.log(`按下其他键: ${e.which}`)
        })
        // 监听全局键盘松开
        $(document).keyup(function (e) {
            if (e.which === 17) {
                console.log('松开了 Ctrl 键')
                // self.isSelectedMode = false
                // return false
            }
        })

        $('.node_submit').on('click',function(){
            let type = $(this).attr('data-type')
            this.nodeAddEdit(type)
        })
    }

    /**
     * 舞台事件
     */
    initStageEvent(){
        let self = this;
        // 点击事件
        this.stage.click(function(event) {
            if (event.button === 0) { // 鼠标左键
                // 关闭所有菜单
                $('div[id$=\'-menu\']').hide()
            }
        })

        // 鼠标移出舞台
        this.stage.mouseout(function (event) {
            // 删掉节点带出来的连线
            if (
                self.currentLink &&
                event.target == null
                // (
                //     event.target == null ||
                //     event.target == self.beginNode ||
                //     event.target === self.currentLink
                // )
            ) {
                self.scene.remove(self.currentLink)
            }
        })
    }

    /**
     * 场景事件
     */
    initSceneEvent(){
        let self = this;
        // 鼠标移入
        this.scene.mouseover(function(event) {

        })
        // 鼠标移出
        this.scene.mouseout(function(event) {

        })
        // 鼠标点击
        this.scene.click(function(event) {
            if (event.target) self.currentNode = event.target
        })
        // 鼠标双击
        this.scene.dbclick(function(event){
            if (event.target) self.currentNode = event.target
        })

        // 鼠标按下松开事件
        // event.button 0-鼠标左键 1-鼠标中间滚轮 2-鼠标右键
        this.scene.mouseup(function (event) {
            if (event.target && event.target instanceof JTopo.Node)
                self.currentNode = event.target
            if (event.target && event.target instanceof JTopo.Link)
                self.currentLink = event.target

            if (event.button === 2) {
                $('div[id$=\'-menu\']').hide() // 所有菜单隐藏

                // 记录事件相对于 页面 的坐标
                let menuX = event.pageX
                let menuY = event.pageY
                // 记录事件相对于 场景 的坐标
                self.xInCanvas = self.scene.mouseDownX
                self.yInCanvas = self.scene.mouseDownY
                if (event.target) {
                    // 这个功能待优化
                    // 目前的话是存在 分组菜单，节点菜单，线菜单，容器菜单
                    if (event.target instanceof JTopo.Node) {
                        let selectedNodes = self.getSelectedNodes()
                        if (selectedNodes.length > 1) menuPositionShow(self.groupMangeMenu,menuX,menuY)
                        else  menuPositionShow(self.nodeMenu,menuX,menuY)
                    }
                    else if (event.target instanceof JTopo.Link) menuPositionShow(self.lineMenu,menuX,menuY)
                    else if (event.target instanceof JTopo.Container) menuPositionShow(self.containerMangeMenu,menuX,menuY)
                } else menuPositionShow(self.mainMenu,menuX,menuY)
            }
            else if (event.button === 1) {}
            else if (event.button === 0) {
                // 左键一般是实现 连接线 的功能
                if (
                    event.target != null &&
                    event.target instanceof JTopo.Node
                ) {
                    if (self.beginNode == null) {
                        // 没有钱起始节点，就没有临时线，但是要产生 临时线
                        self.beginNode = event.target
                        self.currentLink = this.getLink(self.tempNodeA,self.tempNodeZ)
                        // this 是这个场景事件
                        this.add(self.currentLink) // 添加临时线到场景中
                        self.tempNodeA.setLocation(event.x,event.y)
                        self.tempNodeZ.setLocation(event.x,event.y)
                    } else if (
                        event.target &&
                        event.target instanceof JTopo.Node &&
                        self.beginNode !== event.target
                    ) {
                        // 已经有 起始节点，事件触发的 不是起始节点
                        // 我们要产生一条线，或者说，我们要进行接口连接设置
                        let endNode = event.target
                        let link = self.getLink(self.beginNode,endNode)
                        this.add(link) // 添加到场景
                        self.beginNode = null
                        this.remove(self.currentLink) // 临时线 删除
                        self.currentLink = null
                    }
                } else {
                    // 鼠标按下空的地方
                    self.beginNode = null
                    // 存在线就请掉
                    if (self.currentLink) {
                        this.remove(self.currentLink)
                        self.currentLink = null
                    }

                }

            }
        })

        // 鼠标移动事件
        // 一般是实现 临时线 的移动效果
        this.scene.mousemove(function (event) {
            if (self.beginNode) {
                self.tempNodeZ.setLocation(event.x,event.y)
            }
        })

        // 鼠标拖动
        this.scene.mousedrag(function(event) {
            if (self.beginNode) {
                self.tempNodeZ.setLocation(event.x, event.y)
            }
        })
    }

    /**
     * 替换当前舞台，一般是指保存后重新加载
     */
    replaceStage(){}

    /**
     * 返回 场景 选中的节点
     * @returns {Array<JTopo.Node>}
     */
    getSelectedNodes(){
        return this.scene.selectedElements
    }

    /**
     * 返回场景中的首节点
     * @returns {JTopo.Node}
     */
    getSelectedNodeFirst(){
        return this.getSelectedNodes()[0]
    }

    /**
     * 结束节点
     * @param nodeA {JTopo.Node}
     * @param nodeB {JTopo.Node}
     */
    getLink(nodeA,nodeB){
        let lineLink = Map([
            ['line','Link'],
            ['foldLine','FoldLink'],
            ['flexLine','FlexionalLink'],
            ['curveLine','CurveLink'],
        ])
        let link = new JTopo[lineLink.get(this.lineType)](nodeA,nodeB)
        link.lineType = this.lineType // 线类型

        // 设置一下线的默认属性
        link.strokeColor = this.config.linkStrokeColor
        link.lineWidth = this.config.lineDefaultWidth

        // 记录两个节点的id
        link._nodeAId = nodeA.nodeId
        link._nodeBId = nodeB.nodeId

        return link
    }


    /**
     * 场景添加节点
     * @param type {TypeOption}
     */
    addNode(typeOption) {
        let node = typeOption.jTopoNodeName()
        node.setLocation(this.xInCanvas,this.yInCanvas)
        // 打上 类型 标记
        node.__type__ = typeOption.type
        this.nodeFormSync(node,typeOption.formNameEditArr)

        // nodeInit 是函数 就执行函数
        typeof typeOption.nodeInit === "function" && typeOption.nodeInit(node)
        this.scene.add(node) // 添加到场景中
    }

    /**
     * 根据类型拿到表单，然后给 节点 赋值 自定义属性 和 一些直接属性（修改可直接影响绘制效果）
     * @param node {JTopo.Node} 节点
     * @param insides {Array<String>} 可直接赋值到节点的属性
     */
    nodeFormSync(node ,insides){
        if (!node.__type__) throw new Error('不是自定义绘图类型！')
        let options = this.getTypeFormOptions(node.__type__) // 获取表单配置
        console.log('options',options)

        // 已 __ 开头为标注为 自定义属性
        // 我们这里假设 已 __ 开头 的属性只有一个的时候是 添加，添加的时候只需要无脑赋值即可
        // 但是多个的时候就是编辑，这个时候我们需要根据 属性 存在 赋值，不存在则删了
        let __names = getStart__Obj(node),__namesLength = Object.keys(__names).length; // 属性对象，属性个数
        if (__namesLength === 1) // 一个的时候，即 __type__ 我们认为是添加，无脑赋值即可
            for (let optionKey in options) node[optionKey] = options[optionKey]
        else // 如果不是 1个，我们就遍历 属性
            for (const namesKey in __names)
                if (namesKey === '__type__') continue // 类型 直接 本次循环挑中
                else if (namesKey in node) node[namesKey] = options[namesKey] // 存在赋值
                else delete node[namesKey] // 不存在直接删除，确保一些情况值空的话没传进来，但是这个属性会影响绘制效果

        // 选项的 formNameEditArr 表示可以直接赋值到 node 上，并产生相应的效果
        insides.forEach(item => {
            // 对一些 特殊属性 进行 处理，比如 字体颜色需要是 0,0,0 传进来确是十六进制 #000，我们进行转换
            if (item === 'fontColor') node[item] = options[`__${item}`].colorRgb()
            else node[item] = options[`__${item}`]
        })
    }

    /**
     * 返回表单的值
     * @param type {String}
     * @returns {{String: String}}
     */
    getTypeFormOptions(type) {
        let form = $(`#${type}_edit_form`)
        if (form.length === 0) throw new Error(`不存在对应的表单名：${type}_edit_form`)
        let formOption = form.serializeArray()
        let options = {}
        formOption.forEach(option => options[`__${option.name}`] = option.value)
        return options
    }

    /**
     * 节点 添加编辑 处理
     * @param type {String}
     */
    nodeAddEdit(type) {
        if (typeMap.has(type)) {
            const typeOption = typeMap.get(type)
            // 添加
            if (!this.nodeEdit) typeMap.get(type) && this.addNode(typeOption)
            else { // 编辑
                let nodes = this.getSelectedNodes()
                let [node] = nodes
                if (nodes.length === 1)
                    this.nodeFormSync(node,typeOption.formNameEditArr)
                else console.log('暂时不支持多编辑')
            }
            typeOption.toggleModal()
        } else {
            throw new Error('添加或者修改的 类型 不存在 配置表中...')
        }
    }

    /**
     * 编辑节点，拿到节点的属性，赋值到表单上并显示
     * @param node {JTopo.Node}
     */
    editSyncForm(node){
        let form = $(`#${node.__type__}_edit_form`)
        for (const nodeKey in node) {
            if (nodeKey.startsWith('__')) {
                form.find(`input[name=${nodeKey.slice(2)}]`).val(node[nodeKey])
            }
        }
    }
}

/**
 * 菜单定位移动到指定坐标并显示
 * @param menu {*}
 * @param left {number}
 * @param top {number}
 */
function menuPositionShow(menu,left,top){
    menu.css({
        left,top
    }).show()
}